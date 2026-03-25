import React from 'react';
import { brandConfig } from '@easyfactura/brand-config';

export function FooterSimple(): JSX.Element {
  return (
    <div className="border-t p-4 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} {brandConfig.app.legalEntity}. Todos los derechos reservados.
    </div>
  );
}

export default FooterSimple;
