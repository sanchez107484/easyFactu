import Link from 'next/link';
import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  color?: string;
  mb?: string;
}

export default function PageBreadcrumb({
  items,
  color = 'text-slate-500',
  mb = 'mb-4',
}: PageBreadcrumbProps) {
  return (
    <div className={`${mb} flex items-center gap-2 text-sm ${color}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
