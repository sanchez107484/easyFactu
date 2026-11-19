import { createHmac } from 'crypto';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  InvoicePrintTokenGuard,
  InvoicePrintTokenService,
} from '../src/modules/invoice-templates/pdf/invoice-print-token.service';

const ACCESS_SECRET = 'a'.repeat(64);
const SCOPE = { tenantId: 'tenant-a', invoiceId: '7c9e6679-7425-40de-944b-e07fc1f90ae7' };

function setup() {
  const jwt = new JwtService({});
  const config = { get: () => ACCESS_SECRET } as unknown as ConfigService;
  const tokens = new InvoicePrintTokenService(jwt, config);
  return { jwt, tokens, guard: new InvoicePrintTokenGuard(tokens) };
}

function contextFor(token: string | undefined, invoiceId: string) {
  const request = {
    params: { id: invoiceId },
    header: (name: string) => (name === 'x-print-token' ? token : undefined),
    printScope: undefined as unknown,
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('Invoice print token (single PDF generator)', () => {
  it('round-trips the tenant and invoice scope', async () => {
    const { tokens } = setup();
    const token = await tokens.sign(SCOPE);
    await expect(tokens.verify(token)).resolves.toEqual(SCOPE);
  });

  it('rejects a session access token signed with JWT_ACCESS_SECRET', async () => {
    const { jwt, tokens } = setup();
    const sessionToken = await jwt.signAsync(
      { sub: 'user', tenantId: SCOPE.tenantId, invoiceId: SCOPE.invoiceId },
      { secret: ACCESS_SECRET, audience: 'invoice-print' }
    );
    await expect(tokens.verify(sessionToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    const { jwt, tokens } = setup();
    const printKey = createHmac('sha256', ACCESS_SECRET).update('invoice-print').digest('hex');
    const expired = await jwt.signAsync(
      { ...SCOPE, exp: Math.floor(Date.now() / 1000) - 10 },
      { secret: printKey, audience: 'invoice-print' }
    );
    await expect(tokens.verify(expired)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('the guard accepts the token only for its own invoice', async () => {
    const { tokens, guard } = setup();
    const token = await tokens.sign(SCOPE);

    const ok = contextFor(token, SCOPE.invoiceId);
    await expect(guard.canActivate(ok.context)).resolves.toBe(true);
    expect(ok.request.printScope).toEqual(SCOPE);

    const other = contextFor(token, '11111111-1111-4111-8111-111111111111');
    await expect(guard.canActivate(other.context)).rejects.toBeInstanceOf(UnauthorizedException);

    const missing = contextFor(undefined, SCOPE.invoiceId);
    await expect(guard.canActivate(missing.context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
