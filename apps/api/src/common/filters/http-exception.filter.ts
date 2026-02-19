import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message || 'Error',
    };

    // Log errors (but not 400 validation errors to avoid noise)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        JSON.stringify(errorResponse),
        exception.stack
      );
    } else if (status >= 400 && status !== 400) {
      this.logger.warn(`${request.method} ${request.url}`, JSON.stringify(errorResponse));
    }

    response.status(status).json(errorResponse);
  }
}
