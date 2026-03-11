import { NextRequest, NextResponse } from 'next/server';

// Ensure this handler runs in Node.js runtime (Playwright requires Node.js, not Edge)
export const runtime = 'nodejs';

// Allow up to 60 seconds for PDF generation
export const maxDuration = 60;

async function launchBrowser() {
  // In production (Vercel) use @sparticuz/chromium — a compressed serverless-compatible Chromium.
  // Locally, use the full Playwright Chromium installation.
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

  // Local development — use the Playwright-bundled Chromium
  const { chromium } = await import('playwright');
  return chromium.launch({ headless: true });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const browser = await launchBrowser();

  try {
    const context = await browser.newContext({
      colorScheme: 'light',
      // Viewport matches the 595px A4 content width (PDF points at 72 DPI)
      viewport: { width: 595, height: 842 },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Forward the bearer token so the server component can authenticate with the NestJS API
    await page.setExtraHTTPHeaders({ authorization: authHeader });

    // Navigate to the clean print page on this same Next.js server
    const { origin } = new URL(request.url);
    await page.goto(`${origin}/invoice-print/${id}`, { waitUntil: 'networkidle' });

    // Fetch the invoice number for the filename (reuse the page's rendered content)
    const invoiceNumber = await page
      .locator('h1 + div > div:nth-child(2) p:last-child')
      .textContent()
      .catch(() => null);

    // Detect document type from the rendered title to use the right filename prefix
    const documentTitle = await page
      .locator('h1')
      .textContent()
      .catch(() => null);
    const isQuote = documentTitle?.toUpperCase().includes('PRESUPUESTO');
    const filePrefix = isQuote ? 'Presupuesto' : 'Factura';

    const safeFilename = invoiceNumber
      ? `${filePrefix}-${invoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`
      : `${filePrefix}-${id}.pdf`;

    const pdf = await page.pdf({
      // Use the same 595×842 dimensions as the preview (PDF points)
      // so pixel values map 1:1 — no scale needed.
      width: '595px',
      height: '842px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
      },
    });
  } finally {
    await browser.close();
  }
}
