import Image from 'next/image';
import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';
import type { PortableTextMarkComponentProps } from '@portabletext/react';

interface ArticleImageValue {
  _type: 'image';
  asset?: { _ref: string; _type: 'reference' };
  alt?: string;
  caption?: string;
  // Resolved URL injected in the GROQ projection
  url?: string;
}

interface LinkValue {
  _type: 'link';
  href: string;
  blank?: boolean;
}

const components = {
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="mb-4 mt-12 scroll-mt-24 text-2xl font-bold tracking-tight text-foreground first:mt-0 sm:text-3xl">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="mb-3 mt-9 scroll-mt-24 text-xl font-bold tracking-tight text-foreground first:mt-0">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="mb-2 mt-7 scroll-mt-24 text-lg font-semibold text-foreground first:mt-0">
        {children}
      </h4>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-6 text-base leading-[1.8] text-foreground/85 sm:text-[17px]">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="mb-7 mt-7 border-l-[3px] border-primary bg-primary/5 pl-6 pr-4 py-1 text-base italic leading-relaxed text-muted-foreground rounded-r-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-6 ml-1 space-y-2 text-foreground/85">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-6 ml-1 space-y-2 text-foreground/85">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li className="flex gap-3 text-base leading-[1.8] sm:text-[17px]">
        <span className="mt-[0.4em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
        <span>{children}</span>
      </li>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <li className="text-base leading-[1.8] sm:text-[17px] ml-5 list-decimal">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-foreground/80">{children}</em>
    ),
    underline: ({ children }: { children?: React.ReactNode }) => (
      <span className="underline underline-offset-2">{children}</span>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.875em] font-medium text-foreground">
        {children}
      </code>
    ),
    link: ({ value, children }: PortableTextMarkComponentProps<LinkValue>) => (
      <a
        href={value?.href}
        target={value?.blank ? '_blank' : undefined}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="font-medium text-primary underline underline-offset-[3px] decoration-primary/40 hover:decoration-primary transition-colors"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value: ArticleImageValue }) => {
      if (!value.url) return null;

      return (
        <figure className="my-10 -mx-2 sm:mx-0">
          <div className="relative overflow-hidden rounded-xl border bg-muted shadow-sm">
            <Image
              src={value.url}
              alt={value.alt ?? ''}
              width={900}
              height={506}
              className="w-full object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-3 text-center text-sm text-muted-foreground italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

interface ArticleBodyProps {
  body: PortableTextBlock[];
}

export function ArticleBody({ body }: ArticleBodyProps) {
  return (
    <div className="min-w-0 max-w-none">
      <PortableText value={body} components={components} />
    </div>
  );
}
