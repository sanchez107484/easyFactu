import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { SKIP_RESPONSE_ENVELOPE_KEY } from '../decorators/skip-response-envelope.decorator';

export interface Response<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    path: string;
  };
}

/**
 * Reads the metadata directly instead of through a Reflector instance: the interceptor
 * is constructed with `new` in both bootstraps (main.ts and api/index.ts).
 */
function shouldSkipEnvelope(context: ExecutionContext): boolean {
  return (
    Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE_KEY, context.getHandler()) === true ||
    Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE_KEY, context.getClass()) === true
  );
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | T> {
    if (shouldSkipEnvelope(context)) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      }))
    );
  }
}
