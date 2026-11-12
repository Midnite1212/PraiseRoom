import { type RefObject, useEffect, useRef, useState } from 'react';

import {
  type Accent,
  beatAccent,
  type Beat,
  clampBpm,
  FIRST_BPM,
  planBeats,
  type TimeSignature,
} from './tempo';

export type MetronomeStatus = 'idle' | 'playing' | 'unavailable';

type Session = {
  context: AudioContext;
  next: Beat;
  bpm: number;
  signature: TimeSignature;
  heard: Beat[];
  timer: number;
  frame: number;
  closed: boolean;
};

const TIMER_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;
const START_DELAY_S = 0.06;
const CLICK_S = 0.05;
const SILENT_GAIN = 0.0001;
const CLICK_PITCH: Record<Accent, number> = { strong: 1760, medium: 1320, weak: 880 };
const CLICK_GAIN: Record<Accent, number> = { strong: 0.9, medium: 0.6, weak: 0.4 };

const readiness = (): MetronomeStatus =>
  typeof AudioContext === 'undefined' ? 'unavailable' : 'idle';

const click = (context: AudioContext, time: number, accent: Accent) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(CLICK_PITCH[accent], time);
  gain.gain.setValueAtTime(CLICK_GAIN[accent], time);
  gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, time + CLICK_S);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + CLICK_S);
};

const schedule = (session: Session) => {
  const { context } = session;
  const now = context.currentTime;
  const plan = planBeats(session.next, now, now + SCHEDULE_AHEAD_S, session.bpm, session.signature);
  for (const beat of plan.beats) {
    click(context, beat.time, beatAccent(beat.beat, session.signature));
    session.heard.push(beat);
  }
  session.next = plan.next;
};

const closeSession = (ref: RefObject<Session | null>): boolean => {
  const session = ref.current;
  if (!session) return false;
  ref.current = null;
  session.closed = true;
  clearInterval(session.timer);
  cancelAnimationFrame(session.frame);
  session.context.close().catch(() => undefined);
  return true;
};

// `start` must run inside a tap: iOS Safari starts an AudioContext only from one.
export const useMetronome = () => {
  const [status, setStatus] = useState<MetronomeStatus>(readiness);
  const [beat, setBeat] = useState<number | null>(null);
  const [bpm, setBpmState] = useState(FIRST_BPM);
  const [signature, setSignatureState] = useState<TimeSignature>('4/4');
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden' || !closeSession(sessionRef)) return;
      setStatus('idle');
      setBeat(null);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      closeSession(sessionRef);
    };
  }, []);

  const follow = (session: Session) => {
    const tick = () => {
      if (session.closed) return;
      session.frame = requestAnimationFrame(tick);
      const now = session.context.currentTime;
      let current: Beat | undefined;
      while (session.heard[0] && session.heard[0].time <= now) current = session.heard.shift();
      if (current) setBeat(current.beat);
    };
    session.frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (sessionRef.current) return;
    if (readiness() !== 'idle') {
      setStatus('unavailable');
      return;
    }
    let context: AudioContext;
    try {
      context = new AudioContext();
    } catch {
      setStatus('unavailable');
      return;
    }
    const session: Session = {
      context,
      next: { time: context.currentTime + START_DELAY_S, beat: 0 },
      bpm,
      signature,
      heard: [],
      timer: 0,
      frame: 0,
      closed: false,
    };
    sessionRef.current = session;
    context.resume().catch(() => undefined);
    schedule(session);
    session.timer = window.setInterval(() => schedule(session), TIMER_MS);
    follow(session);
    setBeat(null);
    setStatus('playing');
  };

  const stop = () => {
    closeSession(sessionRef);
    setStatus(readiness());
    setBeat(null);
  };

  const setBpm = (next: number) => {
    const clamped = clampBpm(next);
    setBpmState(clamped);
    if (sessionRef.current) sessionRef.current.bpm = clamped;
  };

  const setSignature = (next: TimeSignature) => {
    setSignatureState(next);
    const session = sessionRef.current;
    if (!session) return;
    session.signature = next;
    session.next = { time: session.next.time, beat: 0 };
  };

  return { status, beat, bpm, signature, start, stop, setBpm, setSignature };
};
