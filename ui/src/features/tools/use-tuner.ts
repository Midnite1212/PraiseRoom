import { type RefObject, useEffect, useRef, useState } from 'react';

import { analysisWindowSize, detectPitch, EMPTY_TRACK, trackPitch } from './pitch';

export type TunerStatus = 'idle' | 'asking' | 'listening' | 'denied' | 'unavailable' | 'insecure';

type Session = {
  context: AudioContext;
  stream: MediaStream | null;
  frame: number;
  closed: boolean;
};

const ANALYSIS_INTERVAL_MS = 30;
const DENIED_ERRORS = new Set(['NotAllowedError', 'SecurityError']);

// Echo cancellation, noise suppression and automatic gain all bend the pitch of a held note.
const RAW_AUDIO: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

const readiness = (): TunerStatus => {
  if (!window.isSecureContext) return 'insecure';
  if (typeof navigator.mediaDevices?.getUserMedia !== 'function') return 'unavailable';
  if (typeof AudioContext === 'undefined') return 'unavailable';
  return 'idle';
};

const failureStatus = (error: unknown): TunerStatus =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  typeof error.name === 'string' &&
  DENIED_ERRORS.has(error.name)
    ? 'denied'
    : 'unavailable';

const stopTracks = (stream: MediaStream): void => {
  for (const track of stream.getTracks()) track.stop();
};

const closeSession = (ref: RefObject<Session | null>): boolean => {
  const session = ref.current;
  if (!session) return false;
  ref.current = null;
  session.closed = true;
  cancelAnimationFrame(session.frame);
  if (session.stream) stopTracks(session.stream);
  session.context.close().catch(() => undefined);
  return true;
};

const analyse = (
  session: Session,
  stream: MediaStream,
  onPitch: (frequency: number | null) => void
) => {
  const { context } = session;
  const analyser = context.createAnalyser();
  analyser.fftSize = analysisWindowSize(context.sampleRate);
  context.createMediaStreamSource(stream).connect(analyser);

  const samples = new Float32Array(analyser.fftSize);
  let track = EMPTY_TRACK;
  let analysedAt = -Infinity;
  const tick = (time: number) => {
    if (session.closed) return;
    session.frame = requestAnimationFrame(tick);
    if (time - analysedAt < ANALYSIS_INTERVAL_MS) return;
    analysedAt = time;
    analyser.getFloatTimeDomainData(samples);
    track = trackPitch(track, detectPitch(samples, context.sampleRate)?.frequency ?? null);
    onPitch(track.frequency);
  };
  session.frame = requestAnimationFrame(tick);
};

// `start` must run inside a tap: iOS Safari opens the microphone and an AudioContext only from one.
export const useTuner = () => {
  const [status, setStatus] = useState<TunerStatus>(readiness);
  const [frequency, setFrequency] = useState<number | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden' || !closeSession(sessionRef)) return;
      setStatus('idle');
      setFrequency(null);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      closeSession(sessionRef);
    };
  }, []);

  const end = (next: TunerStatus) => {
    closeSession(sessionRef);
    setStatus(next);
    setFrequency(null);
  };

  const listen = async (session: Session) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: RAW_AUDIO });
      if (session.closed) {
        stopTracks(stream);
        return;
      }
      session.stream = stream;
      for (const track of stream.getTracks()) {
        track.addEventListener('ended', () => {
          if (!session.closed) end('unavailable');
        });
      }
      analyse(session, stream, setFrequency);
      setStatus('listening');
    } catch (error) {
      if (!session.closed) end(failureStatus(error));
    }
  };

  const start = () => {
    if (sessionRef.current) return;
    const ready = readiness();
    if (ready !== 'idle') {
      setStatus(ready);
      return;
    }
    let context: AudioContext;
    try {
      context = new AudioContext();
    } catch {
      setStatus('unavailable');
      return;
    }
    const session: Session = { context, stream: null, frame: 0, closed: false };
    sessionRef.current = session;
    setStatus('asking');
    setFrequency(null);
    context.resume().catch(() => undefined);
    void listen(session);
  };

  return { status, frequency, start, stop: () => end('idle') };
};
