import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper';
import { LegalSection } from '@/components/legal/LegalSection';
import { CookieSettingsButton } from '@/components/analytics/cookie-settings-button';
import { CookieTable } from '@/components/legal/cookie-table';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: `Información sobre el uso de cookies en el sitio web de ${brandConfig.app.name}.`,
  alternates: { canonical: `${brandConfig.app.url}/cookies` },
};

export default function CookiesPage() {
  const { name } = brandConfig.app;

  return (
    <LegalPageWrapper
      path="/cookies"
      title="Política de Cookies"
      subtitle="Información sobre el uso de cookies en nuestro sitio web."
      lastUpdated="22 de noviembre de 2026"
    >
      <LegalSection number="1." heading="Qué son las cookies">
        <p>
          Las cookies son pequeños archivos de texto que se almacenan en el dispositivo del usuario
          cuando visita un sitio web. Permiten recordar información sobre la navegación para mejorar
          la experiencia del usuario.
        </p>
      </LegalSection>

      <LegalSection number="2." heading="Tipos de cookies utilizadas">
        <p>Este sitio web puede utilizar las siguientes cookies:</p>

        <h3 className="mt-5 font-semibold text-slate-700">Cookies técnicas</h3>
        <p>Son necesarias para el funcionamiento del sitio web y permiten, por ejemplo:</p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>iniciar sesión en la plataforma</li>
          <li>mantener la sesión del usuario</li>
          <li>gestionar la seguridad del sistema</li>
        </ul>
        <p className="mt-2 text-xs text-slate-400">
          Estas cookies no requieren consentimiento del usuario.
        </p>

        <h3 className="mt-5 font-semibold text-slate-700">Cookies de análisis (de terceros)</h3>
        <p>
          Usamos Google Analytics, un servicio de Google Ireland Limited, para analizar cómo se usa
          la web y mejorar el servicio:
        </p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>páginas visitadas</li>
          <li>tiempo de permanencia</li>
          <li>navegación dentro del sitio</li>
        </ul>
        <p className="mt-2 text-xs text-slate-400">
          Solo se instalan si las acepta en el banner de cookies.
        </p>

        <h3 className="mt-5 font-semibold text-slate-700">Cookies publicitarias (de terceros)</h3>
        <p>
          Usamos Google Ads, un servicio de Google Ireland Limited, para saber si un visitante llegó
          desde uno de nuestros anuncios y si después se registró. Así medimos qué anuncios
          funcionan y dejamos de invertir en los que no. No vendemos sus datos ni los usamos para
          mostrarle publicidad de otras empresas.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Solo se instalan si las acepta en el banner de cookies.
        </p>

        <h3 className="mt-5 font-semibold text-slate-700">Cookies de personalización</h3>
        <p>Permiten recordar preferencias del usuario, como idioma o configuración.</p>

        <CookieTable />

        <p className="mt-3">
          Google puede tratar estos datos en Estados Unidos, al amparo del Marco de Privacidad de
          Datos UE-EE. UU. Más información en{' '}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            cómo usa Google los datos de los sitios que usan sus servicios
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection number="3." heading="Gestión de cookies">
        <p>
          El usuario puede aceptar, rechazar o configurar el uso de cookies a través del banner de
          cookies del sitio web. También puede eliminarlas o bloquearlas desde la configuración de
          su navegador.
        </p>
        <p className="mt-2">
          Puede cambiar su elección en cualquier momento:{' '}
          <CookieSettingsButton className="font-medium underline underline-offset-2" />
        </p>
      </LegalSection>

      <LegalSection number="4." heading="Desactivación de cookies">
        <p>
          El usuario puede configurar su navegador para bloquear cookies. Sin embargo, algunas
          funcionalidades del sitio web podrían verse afectadas.
        </p>
      </LegalSection>

      <LegalSection number="5." heading="Cambios en la política de cookies">
        <p>
          {name} podrá modificar esta política para adaptarla a cambios legales o técnicos. Se
          informará a los usuarios de cualquier modificación relevante.
        </p>
      </LegalSection>
    </LegalPageWrapper>
  );
}
