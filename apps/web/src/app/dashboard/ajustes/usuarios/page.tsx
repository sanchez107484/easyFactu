'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users as UsersIcon, Shield, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';

export default function AjustesUsuariosPage() {
  const user = useAuthStore((s) => s.user);
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const tenants = useAuthStore((s) => s.tenants);

  const currentTenantRole = tenants.find((t) => t.tenant.id === currentTenant?.id);

  return (
    <div className="space-y-6">
      {/* Usuario actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tu Cuenta
          </CardTitle>
          <CardDescription>Información de tu usuario en esta empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {user.firstName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {currentTenantRole && (
                <Badge variant={currentTenantRole.isOwner ? 'default' : 'outline'}>
                  {currentTenantRole.isOwner ? 'Propietario' : currentTenantRole.role}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-usuario - Próximamente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>Invita a colaboradores y gestiona sus permisos</CardDescription>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Pronto podrás invitar a otros usuarios como asesores o administradores, asignarles
              roles específicos y controlar qué datos pueden ver o modificar.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
