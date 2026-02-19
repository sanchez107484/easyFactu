'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

type NotificationSettings = {
  email: {
    invoiceCreated: boolean;
    invoicePaid: boolean;
    invoiceOverdue: boolean;
    verifactuError: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
  browser: {
    invoiceCreated: boolean;
    invoicePaid: boolean;
    invoiceOverdue: boolean;
    verifactuError: boolean;
  };
  mobile: {
    invoiceCreated: boolean;
    invoicePaid: boolean;
    invoiceOverdue: boolean;
    verifactuError: boolean;
  };
};

export default function AjustesNotificacionesPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      invoiceCreated: true,
      invoicePaid: true,
      invoiceOverdue: true,
      verifactuError: true,
      weeklyReport: false,
      monthlyReport: true,
    },
    browser: {
      invoiceCreated: false,
      invoicePaid: true,
      invoiceOverdue: true,
      verifactuError: true,
    },
    mobile: {
      invoiceCreated: false,
      invoicePaid: true,
      invoiceOverdue: true,
      verifactuError: true,
    },
  });

  const handleToggle = (category: keyof NotificationSettings, key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    toast.success('Preferencias de notificaciones guardadas');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>Configura cómo y cuándo quieres recibir notificaciones</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificaciones por Email
          </CardTitle>
          <CardDescription>Recibe notificaciones en tu correo electrónico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-invoice-created">Factura creada</Label>
              <p className="text-sm text-muted-foreground">Cuando creas una nueva factura</p>
            </div>
            <Switch
              id="email-invoice-created"
              checked={settings.email.invoiceCreated}
              onCheckedChange={(checked) => handleToggle('email', 'invoiceCreated', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-invoice-paid">Factura pagada</Label>
              <p className="text-sm text-muted-foreground">Cuando un cliente paga una factura</p>
            </div>
            <Switch
              id="email-invoice-paid"
              checked={settings.email.invoicePaid}
              onCheckedChange={(checked) => handleToggle('email', 'invoicePaid', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-invoice-overdue">Factura vencida</Label>
              <p className="text-sm text-muted-foreground">
                Cuando una factura llega a su fecha de vencimiento
              </p>
            </div>
            <Switch
              id="email-invoice-overdue"
              checked={settings.email.invoiceOverdue}
              onCheckedChange={(checked) => handleToggle('email', 'invoiceOverdue', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-verifactu-error">Errores VeriFactu</Label>
              <p className="text-sm text-muted-foreground">
                Cuando hay un error al enviar facturas a la AEAT
              </p>
            </div>
            <Switch
              id="email-verifactu-error"
              checked={settings.email.verifactuError}
              onCheckedChange={(checked) => handleToggle('email', 'verifactuError', checked)}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-4 text-sm font-medium">Informes periódicos</h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-weekly-report">Informe semanal</Label>
                  <p className="text-sm text-muted-foreground">Resumen de actividad cada lunes</p>
                </div>
                <Switch
                  id="email-weekly-report"
                  checked={settings.email.weeklyReport}
                  onCheckedChange={(checked) => handleToggle('email', 'weeklyReport', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-monthly-report">Informe mensual</Label>
                  <p className="text-sm text-muted-foreground">
                    Resumen completo el primer día de cada mes
                  </p>
                </div>
                <Switch
                  id="email-monthly-report"
                  checked={settings.email.monthlyReport}
                  onCheckedChange={(checked) => handleToggle('email', 'monthlyReport', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notificaciones del Navegador
          </CardTitle>
          <CardDescription>Notificaciones push en tu navegador web</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-invoice-created">Factura creada</Label>
              <p className="text-sm text-muted-foreground">Cuando creas una nueva factura</p>
            </div>
            <Switch
              id="browser-invoice-created"
              checked={settings.browser.invoiceCreated}
              onCheckedChange={(checked) => handleToggle('browser', 'invoiceCreated', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-invoice-paid">Factura pagada</Label>
              <p className="text-sm text-muted-foreground">Cuando un cliente paga una factura</p>
            </div>
            <Switch
              id="browser-invoice-paid"
              checked={settings.browser.invoicePaid}
              onCheckedChange={(checked) => handleToggle('browser', 'invoicePaid', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-invoice-overdue">Factura vencida</Label>
              <p className="text-sm text-muted-foreground">
                Cuando una factura llega a su fecha de vencimiento
              </p>
            </div>
            <Switch
              id="browser-invoice-overdue"
              checked={settings.browser.invoiceOverdue}
              onCheckedChange={(checked) => handleToggle('browser', 'invoiceOverdue', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-verifactu-error">Errores VeriFactu</Label>
              <p className="text-sm text-muted-foreground">
                Cuando hay un error al enviar facturas a la AEAT
              </p>
            </div>
            <Switch
              id="browser-verifactu-error"
              checked={settings.browser.verifactuError}
              onCheckedChange={(checked) => handleToggle('browser', 'verifactuError', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notificaciones Móviles
          </CardTitle>
          <CardDescription>
            Notificaciones push en tu dispositivo móvil (próximamente)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mobile-invoice-created">Factura creada</Label>
              <p className="text-sm text-muted-foreground">Cuando creas una nueva factura</p>
            </div>
            <Switch
              id="mobile-invoice-created"
              checked={settings.mobile.invoiceCreated}
              onCheckedChange={(checked) => handleToggle('mobile', 'invoiceCreated', checked)}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mobile-invoice-paid">Factura pagada</Label>
              <p className="text-sm text-muted-foreground">Cuando un cliente paga una factura</p>
            </div>
            <Switch
              id="mobile-invoice-paid"
              checked={settings.mobile.invoicePaid}
              onCheckedChange={(checked) => handleToggle('mobile', 'invoicePaid', checked)}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mobile-invoice-overdue">Factura vencida</Label>
              <p className="text-sm text-muted-foreground">
                Cuando una factura llega a su fecha de vencimiento
              </p>
            </div>
            <Switch
              id="mobile-invoice-overdue"
              checked={settings.mobile.invoiceOverdue}
              onCheckedChange={(checked) => handleToggle('mobile', 'invoiceOverdue', checked)}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mobile-verifactu-error">Errores VeriFactu</Label>
              <p className="text-sm text-muted-foreground">
                Cuando hay un error al enviar facturas a la AEAT
              </p>
            </div>
            <Switch
              id="mobile-verifactu-error"
              checked={settings.mobile.verifactuError}
              onCheckedChange={(checked) => handleToggle('mobile', 'verifactuError', checked)}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar preferencias
        </Button>
      </div>
    </div>
  );
}
