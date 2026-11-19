import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'crypto';
import { Request } from 'express';

export const PRINT_TOKEN_HEADER = 'x-print-token';

const PRINT_TOKEN_AUDIENCE = 'invoice-print';
const PRINT_TOKEN_TTL = '2m';

export interface PrintTokenScope {
  tenantId: string;
  invoiceId: string;
}

/**
 * Short-lived token that lets the web PDF renderer read ONE invoice of ONE tenant.
 * Signed with a key derived from JWT_ACCESS_SECRET, so it can never be accepted
 * as a session access token (and a session token is never accepted here).
 */
@Injectable()
export class InvoicePrintTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  sign(scope: PrintTokenScope): Promise<string> {
    return this.jwtService.signAsync(
      { tenantId: scope.tenantId, invoiceId: scope.invoiceId },
      { secret: this.signingKey(), audience: PRINT_TOKEN_AUDIENCE, expiresIn: PRINT_TOKEN_TTL }
    );
  }

  async verify(token: string): Promise<PrintTokenScope> {
    try {
      const payload = await this.jwtService.verifyAsync<Partial<PrintTokenScope>>(token, {
        secret: this.signingKey(),
        audience: PRINT_TOKEN_AUDIENCE,
      });
      if (typeof payload.tenantId !== 'string' || typeof payload.invoiceId !== 'string') {
        throw new UnauthorizedException('Token de impresión no válido');
      }
      return { tenantId: payload.tenantId, invoiceId: payload.invoiceId };
    } catch {
      throw new UnauthorizedException('Token de impresión no válido');
    }
  }

  private signingKey(): string {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) {
      throw new Error('JWT_ACCESS_SECRET is required to sign print tokens');
    }
    return createHmac('sha256', accessSecret).update(PRINT_TOKEN_AUDIENCE).digest('hex');
  }
}

export interface RequestWithPrintScope extends Request {
  printScope?: PrintTokenScope;
}

/** Accepts only a print token issued for the invoice in the route (`:id`). */
@Injectable()
export class InvoicePrintTokenGuard implements CanActivate {
  constructor(private readonly printTokens: InvoicePrintTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithPrintScope>();
    const token = request.header(PRINT_TOKEN_HEADER);
    if (!token) {
      throw new UnauthorizedException('Token de impresión requerido');
    }

    const scope = await this.printTokens.verify(token);
    if (scope.invoiceId !== request.params.id) {
      throw new UnauthorizedException('Token de impresión no válido');
    }

    request.printScope = scope;
    return true;
  }
}
