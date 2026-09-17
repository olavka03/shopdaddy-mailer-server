import { NextFunction, Request, RequestHandler, Response } from 'express';

export const successWrapperMiddleware: RequestHandler = (_req: Request, res: Response, next: NextFunction) => {
  const sendJson = res.json.bind(res);

  res.json = (body?: unknown) => {
    if (body && typeof body === 'object' && 'success' in body) {
      return sendJson(body);
    }

    return sendJson({ success: true, data: body });
  };

  next();
};
