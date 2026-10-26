import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

interface CustomerStoryPost {
  slug: string;
  title: string;
}

// Real customer case published in the Sanity blog. Leave `slug` empty until
// the post is live: the link is hidden instead of pointing to a 404.
export const CUSTOMER_STORY_POST: CustomerStoryPost = {
  slug: '',
  title: '',
};

export function CustomerStoryLink() {
  if (!CUSTOMER_STORY_POST.slug) return null;

  return (
    <Link
      href={`/blog/${CUSTOMER_STORY_POST.slug}`}
      className="group mx-auto mt-10 flex max-w-2xl items-center gap-4 rounded-xl border-2 border-blue-100 bg-blue-50/50 p-5 transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
        <BookOpen className="h-6 w-6 text-blue-600" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Caso real</p>
        <p className="mt-1 font-semibold text-slate-900 group-hover:text-blue-700">
          {CUSTOMER_STORY_POST.title}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 flex-shrink-0 text-blue-500 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
