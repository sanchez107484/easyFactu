import { NextRequest, NextResponse } from 'next/server';
import type { Browser } from 'playwright';

// Ensure this handler runs in Node.js runtime (Playwright requires Node.js, not Edge)
export const runtime = 'nodejs';

// Allow up to 60 seconds for PDF generation
export const maxDuration = 60;

// ==================== BROWSER SINGLETON ====================
// Keep one Chromium process alive for the lifetime of this Next.js worker.
// Eliminates the ~2-3s cold-start on every PDF request.

let _browser: Browser | null = null;
let _launching: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser?.isConnected()) return _browser;

  // Prevent concurrent launches
  if (_launching) return _launching;

  _launching = (async () => {
    if (process.env.VERCEL === '1') {
      const chromiumModule = await import('@sparticuz/chromium');
      const chromium = chromiumModule.default;
      const { chromium: playwrightChromium } = await import('playwright-core');
      const executablePath = await chromium.executablePath();
      return playwrightChromium.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    }
    const { chromium } = await import('playwright');
    return chromium.launch({ headless: true });
  })().then((b) => {
    _browser = b;
    _launching = null;
    b.on('disconnected', () => {
      _browser = null;
    });
    return b;
  });

  return _launching;
}

// ==================== HANDLER ====================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const browser = await getBrowser();
  const context = await browser.newContext({
    colorScheme: 'light',
    viewport: { width: 595, height: 842 },
    deviceScaleFactor: 1,
  });

  try {
    const page = await context.newPage();

    // Forward the bearer token so the server component can authenticate with the NestJS API
    await page.setExtraHTTPHeaders({ authorization: authHeader });

    // Fetch invoice metadata for the filename in parallel with page navigation
    const { origin } = new URL(request.url);
    const [, invoiceData] = await Promise.all([
      page.goto(`${origin}/invoice-print/${id}`, { waitUntil: 'networkidle' }),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1$/, '') ?? 'http://localhost:3001/api'}/v1/invoices/${id}`,
        { headers: { authorization: authHeader } },
      )
        .then((r) => r.json())
        .catch(() => null),
    ]);

    const invoice = invoiceData?.data ?? null;
    const isQuote = invoice?.invoiceType === 'quote';
    const filePrefix = isQuote ? 'Presupuesto' : 'Factura';
    const safeFilename = invoice?.number
      ? `${filePrefix}-${String(invoice.number).replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`
      : `${filePrefix}-${id}.pdf`;

    const pdf = await page.pdf({
      width: '595px',
      height: '842px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    // Use RFC 5987 encoding for the filename to ensure all browsers handle it correctly.
    // The ASCII fallback (filename=) covers older clients; filename*= covers modern ones.
    const encodedFilename = encodeURIComponent(safeFilename);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } finally {
    // Close only the context, not the browser — keeps the process alive for next request
    await context.close();
  }
}
