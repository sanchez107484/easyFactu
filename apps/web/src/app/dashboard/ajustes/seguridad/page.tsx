'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Save, Shield, Key, Smartphone, Monitor, Trash2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const mockSessions = [
  {
    id: '1',
    device: 'Windows PC - Chrome',
    location: 'Madrid, España',
    ip: '83.45.123.45',
    lastActive: '2026-02-19T12:30:00Z',
    current: true,
  },
  {
    id: '2',
    device: 'iPhone 14 - Safari',
    location: 'Barcelona, España',
    ip: '192.168.1.100',
    lastActive: '2026-02-18T20:15:00Z',
    current: false,
  },
  {
    id: '3',
    device: 'MacBook Pro - Chrome',
    location: 'Valencia, España',
    ip: '91.120.45.67',
    lastActive: '2026-02-17T09:45:00Z',
    current: false,
  },
];

export default function AjustesSeguridadPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions] = useState(mockSessions);

  const handleChangePassword = () => {
    toast.success('Contraseña actualizada correctamente');
  };

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.success(
      twoFactorEnabled
        ? 'Autenticación en dos pasos desactivada'
        : 'Autenticación en dos pasos activada',
    );
  };

  const handleCloseSession = (deviceName: string) => {
    toast.success(`Sesión cerrada en ${deviceName}`);
  };

  const handleCloseAllSessions = () => {
    toast.success('Se han cerrado todas las sesiones excepto la actual');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-password">Contraseña actual</Label>
            <Input id="current-password" type="password" />
          </div>

          <div>
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input id="new-password" type="password" />
            <p className="mt-1 text-sm text-muted-foreground">
              Mínimo 8 caracteres, incluye mayúsculas, números y símbolos
            </p>
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
            <Input id="confirm-password" type="password" />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleChangePassword} className="gap-2">
              <Save className="h-4 w-4" />
              Cambiar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Autenticación en Dos Pasos (2FA)
          </CardTitle>
          <CardDescription>Añade una capa extra de seguridad a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {twoFactorEnabled ? (
                <>
                  <strong>La autenticación en dos pasos está activada.</strong> Tu cuenta está
                  protegida con un código adicional al iniciar sesión.
                </>
              ) : (
                <>
                  <strong>Protege tu cuenta.</strong> Activa la autenticación en dos pasos para
                  mayor seguridad.
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h4 className="font-medium">
                Estado: {twoFactorEnabled ? 'Activada' : 'Desactivada'}
              </h4>
              <p className="text-sm text-muted-foreground">
                Requiere código de verificación al iniciar sesión
              </p>
            </div>
            <Button variant={twoFactorEnabled ? 'outline' : 'default'} onClick={handleEnable2FA}>
              {twoFactorEnabled ? 'Desactivar' : 'Activar 2FA'}
            </Button>
          </div>

          {twoFactorEnabled && (
            <div className="space-y-2 rounded-lg border p-4">
              <h4 className="font-medium">Aplicaciones configuradas</h4>
              <p className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4" />
                Google Authenticator - ••••••42
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Cambiar aplicación
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Sesiones Activas
          </CardTitle>
          <CardDescription>Dispositivos con acceso a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" className="gap-2" onClick={handleCloseAllSessions}>
              <Trash2 className="h-4 w-4" />
              Cerrar todas las sesiones
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{session.device}</span>
                      {session.current && (
                        <Badge variant="default" className="ml-2">
                          Actual
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{session.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{session.ip}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(session.lastActive).toLocaleString('es-ES')}
                  </TableCell>
                  <TableCell className="text-right">
                    {!session.current && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 text-destructive"
                        onClick={() => handleCloseSession(session.device)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Cerrar sesión
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription>Acciones irreversibles sobre tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div>
              <h4 className="font-medium">Eliminar cuenta</h4>
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente tu cuenta y todos tus datos
              </p>
            </div>
            <Button variant="destructive">Eliminar cuenta</Button>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>¡Advertencia!</strong> Esta acción no se puede deshacer. Se eliminarán todas
              tus facturas, clientes, productos y configuración de forma permanente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
