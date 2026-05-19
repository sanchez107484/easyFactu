import type { Metadata } from 'next';
import {
  NovafacturaFacturacionOnlinePage,
  novafacturaFacturacionOnlineMetadata,
} from '@/landing/novafactura/facturacion-online-page';

export const metadata: Metadata = novafacturaFacturacionOnlineMetadata;

export default function FacturacionOnlinePage() {
  return <NovafacturaFacturacionOnlinePage />;
}
