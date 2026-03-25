export default function SiteFooter(): JSX.Element {
  return (
    <footer className="w-full border-t bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-600">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div>© {new Date().getFullYear()} EasyFactura. Todos los derechos reservados.</div>
          <div className="flex gap-4">
            <a href="/politica-privacidad">Política de privacidad</a>
            <a href="/terminos-uso">Términos de uso</a>
            <a href="/aviso-legal">Aviso legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
