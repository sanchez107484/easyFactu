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
      <h2 className="mb-4 mt-10 scroll-mt-20 text-2xl font-bold text-foreground first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="mb-3 mt-8 scroll-mt-20 text-xl font-semibold text-foreground first:mt-0">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="mb-2 mt-6 scroll-mt-20 text-lg font-semibold text-foreground first:mt-0">
        {children}
      </h4>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-5 leading-relaxed text-foreground/90">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="mb-6 border-l-4 border-primary pl-5 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-5 ml-6 list-disc space-y-2 text-foreground/90">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-5 ml-6 list-decimal space-y-2 text-foreground/90">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-relaxed">{children}</li>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-relaxed">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
    underline: ({ children }: { children?: React.ReactNode }) => (
      <span className="underline underline-offset-2">{children}</span>
    ),
    link: ({ value, children }: PortableTextMarkComponentProps<LinkValue>) => (
      <a
        href={value?.href}
        target={value?.blank ? '_blank' : undefined}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value: ArticleImageValue }) => {
      if (!value.url) return null;

      return (
        <figure className="my-8">
          <div className="relative overflow-hidden rounded-lg">
            <Image
              src={value.url}
              alt={value.alt ?? ''}
              width={800}
              height={450}
              className="w-full object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
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
    <div className="min-w-0">
      <PortableText value={body} components={components} />
    </div>
  );
}
