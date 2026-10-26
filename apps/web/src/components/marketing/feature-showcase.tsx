import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export interface FeatureScreenshot {
  /** Path under /public, e.g. /capturas/funcionalidades/presupuestos.webp (1200×750). */
  src: string;
  alt: string;
}

export interface FeatureShowcaseItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
  guide: { href: string; label: string };
  screenshot?: FeatureScreenshot;
}

const SCREENSHOT_WIDTH = 1200;
const SCREENSHOT_HEIGHT = 750;

// Until a real capture is added, a neutral app-window frame keeps the layout
// stable (no CLS) without pretending to be a screenshot.
function ScreenshotFrame({ item }: { item: FeatureShowcaseItem }) {
  const Icon = item.icon;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
      </div>
      {item.screenshot ? (
        <Image
          src={item.screenshot.src}
          alt={item.screenshot.alt}
          width={SCREENSHOT_WIDTH}
          height={SCREENSHOT_HEIGHT}
          className="h-auto w-full"
          loading="lazy"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-[16/10] flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-50 to-white"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Icon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-500">{item.title}</p>
        </div>
      )}
    </div>
  );
}

export function FeatureShowcase({
  item,
  isReversed,
}: {
  item: FeatureShowcaseItem;
  isReversed: boolean;
}) {
  return (
    <article id={item.id} className="scroll-mt-24 grid items-center gap-10 md:grid-cols-2">
      <div className={isReversed ? 'md:order-2' : ''}>
        <h3 className="mb-3 text-2xl font-bold text-slate-900">{item.title}</h3>
        <p className="mb-5 text-slate-500">{item.description}</p>
        <ul className="mb-5 space-y-2">
          {item.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              {point}
            </li>
          ))}
        </ul>
        <Link
          href={item.guide.href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
        >
          {item.guide.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ScreenshotFrame item={item} />
    </article>
  );
}

export function FeatureBlockCta({ text }: { text: string }) {
  return (
    <div className="mt-14 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-blue-100 bg-blue-50/50 px-6 py-6 text-center sm:flex-row sm:text-left">
      <p className="font-semibold text-slate-800">{text}</p>
      <Link
        href="/registro"
        className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
      >
        <Sparkles className="h-4 w-4" />
        Crear mi cuenta gratis
      </Link>
    </div>
  );
}
