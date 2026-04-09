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

// ==================== HELPERS ====================

function buildSafeFilename(invoiceNumber: string, customerName: string): string {
  // Replace filesystem-unsafe characters with '-', then collapse multiple dashes and trim.
  const safePart = (s: string) =>
    s
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/-{2,}/g, '-')
      .trim();
  const number = safePart(invoiceNumber);
  const customer = safePart(customerName);
  if (!number && !customer) return 'Factura.pdf';
  if (!customer) return `${number}.pdf`;
  if (!number) return `${customer}.pdf`;
  return `${number} - ${customer}.pdf`;
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

    // Block web-font downloads — the invoice uses system fonts (Helvetica / Times / Courier)
    // only. Aborting these requests removes them from the critical path of the load event.
    await page.route(/\.(woff2?|ttf|otf|eot)(\?.*)?$/i, (route) => route.abort());

    const { origin } = new URL(request.url);

    // 'load' fires once the DOM + stylesheets + images are ready.
    // Unlike 'networkidle', it does NOT wait for Next.js background prefetch requests,
    // which can hold networkidle for 1-3 extra seconds on every request.
    await page.goto(`${origin}/invoice-print/${id}`, { waitUntil: 'load' });

    // Read the filename metadata injected by the print page server component.
    // This replaces the earlier parallel fetch to /v1/invoices/:id that existed
    // only to extract the invoice number and type for the filename.
    const { invoiceNumber, customerName } = await page.evaluate(() => {
      const el = document.querySelector('[data-pdf-ready]');
      return {
        invoiceNumber: el?.getAttribute('data-invoice-number') ?? '',
        customerName: el?.getAttribute('data-invoice-customer') ?? '',
      };
    });

    const safeFilename = buildSafeFilename(invoiceNumber, customerName);

    const pdf = await page.pdf({
      width: '595px',
      height: '842px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

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
