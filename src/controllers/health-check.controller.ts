import { RequestHandler } from 'express';

export const healthCheckController: RequestHandler = (_req, res) => {
  return res.json({ status: 'ok', uptime: process.uptime() });
};
