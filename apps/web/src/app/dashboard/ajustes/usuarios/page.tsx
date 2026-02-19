'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Mail, Shield, Users as UsersIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const mockUsers = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@miempresa.com',
    role: 'OWNER',
    status: 'active',
    lastLogin: '2026-02-19T10:30:00Z',
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@miempresa.com',
    role: 'ADMIN',
    status: 'active',
    lastLogin: '2026-02-18T15:45:00Z',
  },
  {
    id: '3',
    name: 'Carlos López',
    email: 'carlos@miempresa.com',
    role: 'VIEWER',
    status: 'pending',
    lastLogin: null,
  },
];

const roleLabels = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Visualizador',
};

export default function AjustesUsuariosPage() {
  const [users] = useState(mockUsers);

  const handleInvite = () => {
    toast.success('Invitación enviada correctamente');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Usuarios y Permisos
          </CardTitle>
          <CardDescription>
            Gestiona quién puede acceder a tu cuenta y qué pueden hacer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Tu plan actual permite hasta <strong>5 usuarios</strong>. Tienes{' '}
              <strong>{users.length}</strong> usuarios activos.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invitar usuario
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'OWNER' ? 'default' : 'outline'}>
                      {roleLabels[user.role as keyof typeof roleLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.status === 'active' ? (
                      <Badge variant="default">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('es-ES')
                      : 'Nunca'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.role !== 'OWNER' && (
                        <>
                          <Button size="sm" variant="ghost" className="gap-2">
                            <Edit className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-2 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitar Nuevo Usuario</CardTitle>
          <CardDescription>Envía una invitación por email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" placeholder="usuario@ejemplo.com" />
            </div>

            <div>
              <Label htmlFor="invite-role">Rol</Label>
              <Select defaultValue="VIEWER">
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador - Control total</SelectItem>
                  <SelectItem value="EDITOR">Editor - Crear y editar</SelectItem>
                  <SelectItem value="VIEWER">Visualizador - Solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleInvite} className="gap-2">
              <Mail className="h-4 w-4" />
              Enviar invitación
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles y Permisos</CardTitle>
          <CardDescription>Qué puede hacer cada rol</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Propietario</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Control total de la cuenta, incluida gestión de usuarios, facturación y eliminación
                de datos.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Administrador</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Puede crear, editar y eliminar facturas, clientes y productos. No puede gestionar
                usuarios ni configuración de pago.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Editor</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Puede crear y editar facturas, clientes y productos, pero no eliminarlos.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Visualizador</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Solo puede ver facturas, clientes y productos. No puede realizar cambios.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
