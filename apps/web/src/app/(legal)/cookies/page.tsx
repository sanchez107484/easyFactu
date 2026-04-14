import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper';
import { LegalSection } from '@/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: `Información sobre el uso de cookies en el sitio web de ${brandConfig.app.name}.`,
};

export default function CookiesPage() {
  const { name } = brandConfig.app;

  return (
    <LegalPageWrapper
      title="Política de Cookies"
      subtitle="Información sobre el uso de cookies en nuestro sitio web."
      lastUpdated="14 de abril de 2026"
    >
      <LegalSection number="1." heading="Qué son las cookies">
        <p>
          Las cookies son pequeños archivos de texto que se almacenan en el dispositivo del
          usuario cuando visita un sitio web. Permiten recordar información sobre la navegación
          para mejorar la experiencia del usuario.
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

        <h3 className="mt-5 font-semibold text-slate-700">Cookies de análisis</h3>
        <p>
          Permiten analizar el comportamiento de los usuarios en la web para mejorar el
          servicio:
        </p>
        <ul className="ml-4 mt-2 list-inside list-disc space-y-1">
          <li>páginas visitadas</li>
          <li>tiempo de permanencia</li>
          <li>navegación dentro del sitio</li>
        </ul>
        <p className="mt-2">
          Estas cookies pueden utilizar herramientas como Google Analytics u otros sistemas de
          análisis.
        </p>

        <h3 className="mt-5 font-semibold text-slate-700">Cookies de personalización</h3>
        <p>Permiten recordar preferencias del usuario, como idioma o configuración.</p>
      </LegalSection>

      <LegalSection number="3." heading="Gestión de cookies">
        <p>
          El usuario puede aceptar, rechazar o configurar el uso de cookies a través del banner
          de cookies del sitio web. También puede eliminarlas o bloquearlas desde la
          configuración de su navegador.
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
