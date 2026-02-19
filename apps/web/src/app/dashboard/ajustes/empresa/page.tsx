'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Upload, FileCheck, AlertCircle, Building2, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AjustesEmpresaPage() {
  const [businessName, setBusinessName] = useState('Mi Empresa SL');
  const [nif, setNif] = useState('B12345678');
  const [address, setAddress] = useState('Calle Principal 123');
  const [city, setCity] = useState('Madrid');
  const [postalCode, setPostalCode] = useState('28001');
  const [phone, setPhone] = useState('+34 900 123 456');
  const [email, setEmail] = useState('contacto@miempresa.com');

  const handleSave = () => {
    // TODO: Implementar guardado real
    toast.success('Datos de la empresa actualizados');
  };

  const handleLogoUpload = () => {
    // TODO: Implementar upload real
    toast.success('Logo actualizado correctamente');
  };

  const handleCertificateUpload = () => {
    // TODO: Implementar upload real de certificado
    toast.success('Certificado digital instalado');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Datos de la Empresa
          </CardTitle>
          <CardDescription>Información básica de tu empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="business-name">Nombre comercial / Razón social</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="nif">NIF / CIF</Label>
              <Input id="nif" value={nif} onChange={(e) => setNif(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="email">Email de contacto</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Dirección fiscal</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="postal-code">Código Postal</Label>
              <Input
                id="postal-code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo de la Empresa
          </CardTitle>
          <CardDescription>Sube el logo que aparecerá en tus facturas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-lg border-2 border-dashed bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                Formatos permitidos: JPG, PNG, SVG. Tamaño máximo: 2MB
              </p>
              <Button variant="outline" onClick={handleLogoUpload} className="gap-2">
                <Upload className="h-4 w-4" />
                Subir logo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Certificado Digital VeriFactu
          </CardTitle>
          <CardDescription>
            Certificado necesario para firmar facturas según VeriFactu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileCheck className="h-4 w-4" />
            <AlertDescription>
              <strong>Certificado instalado:</strong> FNMT - Válido hasta 15/06/2027
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="certificate">Subir nuevo certificado (.p12 / .pfx)</Label>
            <div className="flex gap-2">
              <Input id="certificate" type="file" accept=".p12,.pfx" className="flex-1" />
              <Button variant="outline" onClick={handleCertificateUpload} className="gap-2">
                <Upload className="h-4 w-4" />
                Instalar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              El certificado debe estar en formato .p12 o .pfx protegido con contraseña
            </p>
          </div>

          <div>
            <Label htmlFor="cert-password">Contraseña del certificado</Label>
            <Input id="cert-password" type="password" placeholder="••••••••" />
          </div>

          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> El certificado digital es obligatorio para cumplir con
              VeriFactu. Debe ser emitido por la FNMT o autoridad certificadora válida.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos Bancarios</CardTitle>
          <CardDescription>Cuenta bancaria para recibir pagos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input id="iban" placeholder="ES00 0000 0000 0000 0000 0000" />
          </div>

          <div>
            <Label htmlFor="bank-name">Nombre del banco</Label>
            <Input id="bank-name" placeholder="Nombre de la entidad bancaria" />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
