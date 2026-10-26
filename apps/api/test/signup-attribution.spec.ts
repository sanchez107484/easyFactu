import { PrismaService } from '../src/prisma/prisma.service';
import {
  extractLandingPath,
  toSignupAttributionColumns,
} from '../src/modules/auth/signup-attribution.mapper';
import { SignupStatsService } from '../src/modules/signup-stats/signup-stats.service';

describe('toSignupAttributionColumns', () => {
  it('keeps the landing page of three registrations from three different pages', () => {
    const registrations = [
      {
        landingUrl: 'https://novafactura.es/?utm_source=google&utm_medium=cpc',
        utmSource: 'google',
        utmMedium: 'cpc',
      },
      { landingUrl: 'https://novafactura.es/precios/', referrer: 'https://www.bing.com/' },
      {
        landingUrl: 'https://novafactura.es/verifactu/cuando-es-obligatorio?x=1',
        firstVisitAt: '2026-10-20T08:00:00.000Z',
      },
    ];

    const columns = registrations.map(toSignupAttributionColumns);

    expect(columns.map((c) => c.signupLandingPath)).toEqual([
      '/',
      '/precios',
      '/verifactu/cuando-es-obligatorio',
    ]);
    const [fromHome, fromPricing, fromVerifactu] = columns;
    expect(fromHome).toMatchObject({ signupUtmSource: 'google', signupUtmMedium: 'cpc' });
    expect(fromPricing).toMatchObject({ signupReferrer: 'https://www.bing.com/' });
    expect(fromVerifactu).toMatchObject({
      signupFirstVisitAt: new Date('2026-10-20T08:00:00.000Z'),
    });
  });

  it('returns no columns when the registration has no attribution', () => {
    expect(toSignupAttributionColumns(undefined)).toEqual({});
  });

  it('ignores malformed landing URLs instead of failing the registration', () => {
    expect(extractLandingPath('not a url')).toBeNull();
  });
});

describe('SignupStatsService', () => {
  it('counts registered owners and caches the result for one hour', async () => {
    const count = jest.fn().mockResolvedValueOnce(120).mockResolvedValueOnce(121);
    const service = new SignupStatsService({ user: { count } } as unknown as PrismaService);
    jest.useFakeTimers().setSystemTime(new Date('2026-10-26T10:00:00Z'));

    expect((await service.getStats()).registeredCount).toBe(120);
    jest.setSystemTime(new Date('2026-10-26T10:59:00Z'));
    expect((await service.getStats()).registeredCount).toBe(120);
    jest.setSystemTime(new Date('2026-10-26T11:00:01Z'));
    expect((await service.getStats()).registeredCount).toBe(121);
    expect(count).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
