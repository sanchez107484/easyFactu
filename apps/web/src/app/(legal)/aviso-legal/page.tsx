import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper';
import { LegalSection } from '@/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Aviso Legal',
  description: `Información legal sobre el titular de ${brandConfig.app.name}: condiciones de acceso, propiedad intelectual y legislación aplicable.`,
};

export default function AvisoLegalPage() {
  const { name, legalEntity, nif, address, city, supportEmail, domain } = brandConfig.app;

  return (
    <LegalPageWrapper
      title="Aviso Legal"
      subtitle="Información general y condiciones de acceso al sitio web."
      lastUpdated="14 de abril de 2026"
    >
      <LegalSection number="1." heading="Información general">
        <p>
          En cumplimiento de la Ley de Servicios de la Sociedad de la Información y Comercio
          Electrónico (LSSI‑CE), se informa que el titular de este sitio web es:
        </p>
        <dl className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Titular:</dt>
            <dd>{legalEntity}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Nombre comercial:</dt>
            <dd>{name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">NIF/CIF:</dt>
            <dd>{nif}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Domicilio:</dt>
            <dd>{address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Correo electrónico:</dt>
            <dd>
              <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                {supportEmail}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="min-w-32 font-medium text-slate-700">Dominio web:</dt>
            <dd>{domain}</dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection number="2." heading="Objeto">
        <p>
          El presente sitio web tiene como finalidad ofrecer información y acceso al software{' '}
          {name}, una plataforma online de gestión de facturación destinada a autónomos y
          empresas.
        </p>
      </LegalSection>

      <LegalSection number="3." heading="Condiciones de acceso">
        <p>
          El acceso al sitio web es gratuito salvo en lo relativo al coste de la conexión a
          internet.
        </p>
        <p>
          El uso de la web atribuye la condición de usuario e implica la aceptación plena de las
          condiciones aquí establecidas.
        </p>
      </LegalSection>

      <LegalSection number="4." heading="Propiedad intelectual">
        <p>Todos los contenidos del sitio web, incluyendo:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>software</li>
          <li>diseño</li>
          <li>código</li>
          <li>logotipos</li>
          <li>textos</li>
          <li>bases de datos</li>
        </ul>
        <p className="mt-3">
          son propiedad de {legalEntity} o de sus licenciantes. Queda prohibida su reproducción,
          distribución o modificación sin autorización expresa.
        </p>
      </LegalSection>

      <LegalSection number="5." heading="Responsabilidad">
        <p>{name} no se responsabiliza de:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>errores u omisiones en los contenidos</li>
          <li>interrupciones del servicio</li>
          <li>daños derivados del uso del sitio web</li>
        </ul>
      </LegalSection>

      <LegalSection number="6." heading="Legislación aplicable">
        <p>
          Las presentes condiciones se rigen por la legislación española. Para cualquier
          controversia las partes se someterán a los tribunales de {city}.
        </p>
      </LegalSection>
    </LegalPageWrapper>
  );
}
