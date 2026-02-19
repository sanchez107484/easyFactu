import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error de base de datos';

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = 'Ya existe un registro con estos datos';
        break;
      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Registro no encontrado';
        break;
      case 'P2003': // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'No se puede eliminar este registro porque está en uso';
        break;
      case 'P2014': // Required relation violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Faltan datos relacionados requeridos';
        break;
      default:
        this.logger.error(`Prisma error code ${exception.code}:`, exception.message);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: 'Database Error',
      timestamp: new Date().toISOString(),
    });
  }
}
