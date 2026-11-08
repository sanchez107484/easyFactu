import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';
const CLIENT_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export interface RequestWithId extends Request {
  requestId?: string;
}

export function getRequestId(request: Request): string | undefined {
  return (request as RequestWithId).requestId;
}

function resolveRequestId(incoming: string | undefined): string {
  if (incoming && CLIENT_REQUEST_ID_PATTERN.test(incoming)) return incoming;
  return `req_${randomUUID()}`;
}

/**
 * Keeps the integrator's X-Request-Id (or creates one) and returns it on every response.
 * A middleware instead of an interceptor so that guard rejections (401, 429) carry it too.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const requestId = resolveRequestId(request.header(REQUEST_ID_HEADER));
    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
