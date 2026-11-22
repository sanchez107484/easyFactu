interface CookieRow {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

const COOKIES: CookieRow[] = [
  {
    name: 'ef_consent (almacenamiento local)',
    provider: 'Propia',
    purpose: 'Recordar su elección sobre las cookies',
    duration: 'Hasta que la borre',
  },
  {
    name: '_ga, _ga_*',
    provider: 'Google Analytics',
    purpose: 'Distinguir visitantes y sesiones para las estadísticas',
    duration: '2 años',
  },
  {
    name: '_gcl_au, _gcl_aw',
    provider: 'Google Ads',
    purpose: 'Asociar un registro con el anuncio en el que se hizo clic',
    duration: '90 días',
  },
];

export function CookieTable() {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b text-slate-700">
          <tr>
            <th className="py-2 pr-3 font-semibold">Cookie</th>
            <th className="py-2 pr-3 font-semibold">Proveedor</th>
            <th className="py-2 pr-3 font-semibold">Finalidad</th>
            <th className="py-2 font-semibold">Duración</th>
          </tr>
        </thead>
        <tbody>
          {COOKIES.map((cookie) => (
            <tr key={cookie.name} className="border-b last:border-0">
              <td className="py-2 pr-3 font-mono">{cookie.name}</td>
              <td className="py-2 pr-3">{cookie.provider}</td>
              <td className="py-2 pr-3">{cookie.purpose}</td>
              <td className="py-2">{cookie.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
