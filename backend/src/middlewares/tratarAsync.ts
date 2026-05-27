import { NextFunction, Request, RequestHandler, Response } from 'express';

type HandlerAssincrono = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function tratarAsync(handler: HandlerAssincrono): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
