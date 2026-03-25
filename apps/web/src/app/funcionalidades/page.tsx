export default function Page(): JSX.Element {
  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold">Funcionalidades</h1>
        <p className="mt-4 text-gray-600">
          Resumen breve de las funcionalidades principales de la aplicación.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-medium">Características destacadas</h2>
          <ul className="mt-3 list-disc pl-5 text-gray-700">
            <li>Gestión de facturas y clientes</li>
            <li>Generación de PDF y firma electrónica</li>
            <li>Colas para envío a AEAT y procesos asíncronos</li>
          </ul>
        </section>

        <p className="mt-8 text-sm text-gray-500">
          (Página básica — personaliza contenido según necesidad)
        </p>
      </div>
    </main>
  );
}
