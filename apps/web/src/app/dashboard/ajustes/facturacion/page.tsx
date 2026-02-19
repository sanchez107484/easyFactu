'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { Save, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockSeries = [
  {
    id: '1',
    code: 'F',
    name: 'Facturas',
    prefix: 'F',
    nextNumber: 125,
    isDefault: true,
  },
  {
    id: '2',
    code: 'FR',
    name: 'Facturas Rectificativas',
    prefix: 'FR',
    nextNumber: 8,
    isDefault: false,
  },
  {
    id: '3',
    code: 'PR',
    name: 'Proformas',
    prefix: 'PR',
    nextNumber: 34,
    isDefault: false,
  },
];

export default function AjustesFacturacionPage() {
  const [series] = useState(mockSeries);
  const [defaultDueDate, setDefaultDueDate] = useState('30');
  const [defaultNotes, setDefaultNotes] = useState('');
  const [defaultFooter, setDefaultFooter] = useState(
    'Gracias por su confianza. Para cualquier consulta, no dude en contactarnos.',
  );

  const handleSave = () => {
    toast.success('Configuración de facturación guardada');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Series de Facturación
          </CardTitle>
          <CardDescription>
            Gestiona las diferentes series de numeración para tus facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva serie
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Prefijo</TableHead>
                <TableHead>Siguiente nº</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.map((serie) => (
                <TableRow key={serie.id}>
                  <TableCell className="font-medium">{serie.code}</TableCell>
                  <TableCell>{serie.name}</TableCell>
                  <TableCell>{serie.prefix}</TableCell>
                  <TableCell>{serie.nextNumber}</TableCell>
                  <TableCell>
                    {serie.isDefault ? (
                      <Badge variant="default">Por defecto</Badge>
                    ) : (
                      <Badge variant="outline">Activa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="gap-2">
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      {!serie.isDefault && (
                        <Button size="sm" variant="ghost" className="gap-2 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
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
          <CardTitle>Valores por Defecto</CardTitle>
          <CardDescription>Configuración predeterminada para nuevas facturas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="due-date">Vencimiento (días)</Label>
              <Input
                id="due-date"
                type="number"
                value={defaultDueDate}
                onChange={(e) => setDefaultDueDate(e.target.value)}
              />
              <p className="mt-1 text-sm text-muted-foreground">Días desde la fecha de emisión</p>
            </div>

            <div>
              <Label htmlFor="payment-method">Forma de pago predeterminada</Label>
              <Select defaultValue="transfer">
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="bizum">Bizum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="default-notes">Notas predeterminadas</Label>
            <Textarea
              id="default-notes"
              rows={3}
              value={defaultNotes}
              onChange={(e) => setDefaultNotes(e.target.value)}
              placeholder="Notas que aparecerán en la factura..."
            />
          </div>

          <div>
            <Label htmlFor="default-footer">Pie de factura</Label>
            <Textarea
              id="default-footer"
              rows={2}
              value={defaultFooter}
              onChange={(e) => setDefaultFooter(e.target.value)}
            />
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
          <CardTitle>Impuestos</CardTitle>
          <CardDescription>Configuración de tipos impositivos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="default-iva">IVA por defecto</Label>
              <Select defaultValue="21">
                <SelectTrigger id="default-iva">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Exento (0%)</SelectItem>
                  <SelectItem value="4">Superreducido (4%)</SelectItem>
                  <SelectItem value="10">Reducido (10%)</SelectItem>
                  <SelectItem value="21">General (21%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="default-irpf">IRPF por defecto</Label>
              <Select defaultValue="15">
                <SelectTrigger id="default-irpf">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin retención (0%)</SelectItem>
                  <SelectItem value="7">Actividades agrícolas (7%)</SelectItem>
                  <SelectItem value="15">Profesionales (15%)</SelectItem>
                  <SelectItem value="19">Actividades artísticas (19%)</SelectItem>
                </SelectContent>
              </Select>
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
          <CardTitle>Plantilla de Factura</CardTitle>
          <CardDescription>Diseño y formato de las facturas PDF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="template">Plantilla</Label>
              <Select defaultValue="modern">
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Clásica</SelectItem>
                  <SelectItem value="modern">Moderna</SelectItem>
                  <SelectItem value="minimal">Minimalista</SelectItem>
                  <SelectItem value="corporate">Corporativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Color principal</Label>
              <div className="flex gap-2">
                <Input id="color" type="color" defaultValue="#0066cc" className="w-20" />
                <Input defaultValue="#0066cc" className="flex-1" />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline">Vista previa</Button>
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
