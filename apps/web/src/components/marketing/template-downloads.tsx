import { Download } from 'lucide-react';

export interface TemplateDownload {
  href: string;
  format: 'Excel' | 'Word' | 'PDF';
  description: string;
}

const FORMAT_BADGE: Record<TemplateDownload['format'], string> = {
  Excel: 'bg-green-100 text-green-800',
  Word: 'bg-blue-100 text-blue-800',
  PDF: 'bg-red-100 text-red-800',
};

/** Grid of free downloadable files (static assets under /public/plantillas). */
export function TemplateDownloads({ files }: { files: readonly TemplateDownload[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {files.map((file) => (
        <a
          key={file.href}
          href={file.href}
          download
          className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-px hover:border-indigo-300 hover:shadow-md"
        >
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <span className="min-w-0">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${FORMAT_BADGE[file.format]}`}
            >
              {file.format}
            </span>
            <span className="mt-1.5 block text-sm text-slate-600">{file.description}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
