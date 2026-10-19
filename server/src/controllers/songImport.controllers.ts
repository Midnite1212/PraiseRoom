import { Request, RequestHandler, Response } from 'express';

import { hasNulCharacter } from '../db/cast';
import { UpstreamError } from '../import/fetchPage';
import {
  importFromText,
  importFromUrl,
  isImportableUrl,
  lookupMetadata,
  searchCharts,
} from '../import/importer';
import { sendError, sendResponse } from '../utils/response';

const MAX_QUERY_LENGTH = 100;
const MAX_URL_LENGTH = 500;
const MAX_TEXT_LENGTH = 30_000;

const isText = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= maxLength &&
  !hasNulCharacter(value);

const sendUpstreamError = (res: Response, error: unknown): void => {
  if (!(error instanceof UpstreamError)) {
    sendError(res, error);
    return;
  }
  if (error.kind === 'blocked') sendResponse(res, 400, 'Unsupported link');
  else if (error.kind === 'not-found') sendResponse(res, 422, 'No chord chart found');
  else sendResponse(res, 502, 'Chord site unavailable');
};

const searchImportCandidates: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { q } = req.query;
  if (!isText(q, MAX_QUERY_LENGTH)) {
    sendResponse(res, 400, 'Invalid search query');
    return;
  }
  try {
    sendResponse(res, 200, await searchCharts(q.trim()));
  } catch (error: unknown) {
    sendError(res, error);
  }
};

const fetchImportChart: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const url: unknown = req.body?.url;
  if (!isText(url, MAX_URL_LENGTH) || !isImportableUrl(url.trim())) {
    sendResponse(res, 400, 'Unsupported link');
    return;
  }
  try {
    sendResponse(res, 200, await importFromUrl(url.trim()));
  } catch (error: unknown) {
    sendUpstreamError(res, error);
  }
};

const convertImportText: RequestHandler = (req: Request, res: Response): void => {
  const text: unknown = req.body?.text;
  if (!isText(text, MAX_TEXT_LENGTH)) {
    sendResponse(res, 400, 'Invalid chart text');
    return;
  }
  try {
    const chart = importFromText(text);
    if (!/\[[A-G]/.test(chart.chordLyrics)) {
      sendResponse(res, 422, 'No chords found');
      return;
    }
    sendResponse(res, 200, chart);
  } catch (error: unknown) {
    sendError(res, error);
  }
};

const getImportMetadata: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { title, artist } = req.query;
  if (!isText(title, MAX_QUERY_LENGTH) || !isText(artist, MAX_QUERY_LENGTH)) {
    sendResponse(res, 400, 'Invalid title or artist');
    return;
  }
  try {
    sendResponse(res, 200, await lookupMetadata(title.trim(), artist.trim()));
  } catch (error: unknown) {
    sendUpstreamError(res, error);
  }
};

export { convertImportText, fetchImportChart, getImportMetadata, searchImportCandidates };
