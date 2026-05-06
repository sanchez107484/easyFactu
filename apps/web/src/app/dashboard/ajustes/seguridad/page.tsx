'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AjustesSeguridadPage() {
  return (
    <div className="space-y-6">
      {/* 2FA - Próximamente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Autenticación en Dos Pasos
              </CardTitle>
              <CardDescription>Añade una capa extra de seguridad a tu cuenta</CardDescription>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Pronto podrás activar la autenticación en dos pasos mediante una aplicación como
              Google Authenticator o Authy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Sesiones - Próximamente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Sesiones Activas
              </CardTitle>
              <CardDescription>Dispositivos con acceso a tu cuenta</CardDescription>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Monitor className="h-4 w-4" />
            <AlertDescription>
              Pronto podrás ver y cerrar las sesiones activas en todos tus dispositivos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
