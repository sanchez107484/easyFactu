export default function Page(): JSX.Element {
  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold">Blog</h1>
        <p className="mt-4 text-gray-600">
          Últimas entradas y noticias sobre facturación y novedades del producto.
        </p>

        <section className="mt-8">
          <article className="border-b py-4">
            <h2 className="text-xl font-medium">Entrada de ejemplo</h2>
            <p className="mt-2 text-gray-700">Resumen de la entrada de blog. Link para leer más.</p>
          </article>
        </section>

        <p className="mt-8 text-sm text-gray-500">
          (Placeholder — conectar con CMS o listado real)
        </p>
      </div>
    </main>
  );
}
