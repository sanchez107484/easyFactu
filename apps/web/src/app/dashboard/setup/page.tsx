'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SetupStepper } from '@/components/setup-stepper';
import { brandConfig } from '@easyfactura/brand-config';
import { Building2, Upload, FileText, CreditCard, Check } from 'lucide-react';
import { validateNif, validateIban } from '@easyfactura/shared-validators';
import { PROVINCES } from '@easyfactura/shared-constants';

const STEPS = [
  { id: 1, title: 'Empresa', description: 'Datos básicos' },
  { id: 2, title: 'Logo', description: 'Imagen corporativa' },
  { id: 3, title: 'Facturación', description: 'Configuración' },
  { id: 4, title: 'Certificado', description: 'Digital' },
  { id: 5, title: 'Datos bancarios', description: 'IBAN' },
];

// Schemas de validación para cada paso
const step1Schema = z.object({
  businessName: z.string().min(2, 'El nombre de la empresa es obligatorio'),
  legalName: z.string().optional(),
  nif: z.string().refine((val) => validateNif(val).isValid, 'NIF/CIF inválido'),
  address: z.string().min(5, 'La dirección es obligatoria'),
  postalCode: z.string().regex(/^\d{5}$/, 'Código postal inválido'),
  city: z.string().min(2, 'La ciudad es obligatoria'),
  province: z.string().min(2, 'La provincia es obligatoria'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido'),
});

const step3Schema = z.object({
  invoicePrefix: z.string().min(1).max(10),
  nextInvoiceNumber: z.number().min(1),
  defaultPaymentMethod: z.string(),
});

const step5Schema = z.object({
  iban: z.string().refine((val) => validateIban(val).isValid, 'IBAN inválido'),
  accountHolder: z.string().min(2, 'El titular de la cuenta es obligatorio'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step5Data = z.infer<typeof step5Schema>;

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<any>({});
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: '',
      legalName: '',
      nif: '',
      address: '',
      postalCode: '',
      city: '',
      province: '',
      phone: '',
      email: '',
    },
  });

  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      invoicePrefix: 'F-',
      nextInvoiceNumber: 1,
      defaultPaymentMethod: 'TRANSFER',
    },
  });

  const form5 = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
  });

  const handleNext = async () => {
    let isValid = true;

    if (currentStep === 1) {
      isValid = await form1.trigger();
      if (isValid) {
        setSetupData({ ...setupData, ...form1.getValues() });
      }
    } else if (currentStep === 3) {
      isValid = await form3.trigger();
      if (isValid) {
        setSetupData({ ...setupData, ...form3.getValues() });
      }
    } else if (currentStep === 5) {
      isValid = await form5.trigger();
      if (isValid) {
        setSetupData({ ...setupData, ...form5.getValues() });
      }
    }

    if (isValid) {
      if (currentStep === 5) {
        await handleComplete();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    if (currentStep === 5) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertificate(file);
    }
  };

  const handleComplete = async () => {
    try {
      // TODO: Enviar todos los datos al backend
      // await apiClient.post('/tenants/setup', setupData);

      toast.success('¡Todo listo! Ya puedes empezar a facturar');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Error al completar la configuración');
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 py-8">
      <div className="container max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">{brandConfig.app.name}</h1>
          <p className="text-muted-foreground">Configuración inicial - Solo te tomará 5 minutos</p>
        </div>

        <div className="mb-8">
          <SetupStepper steps={STEPS} currentStep={currentStep} />
        </div>

        <Card>
          <CardContent className="p-6">
            {/* PASO 1: Datos de la empresa */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary-600" />
                  <div>
                    <CardTitle>Datos de la empresa</CardTitle>
                    <CardDescription>
                      Información básica de tu negocio que aparecerá en las facturas
                    </CardDescription>
                  </div>
                </div>

                <Form {...form1}>
                  <form className="space-y-4">
                    <FormField
                      control={form1.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre comercial *</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu empresa SL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form1.control}
                      name="legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razón social (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Si es diferente al nombre comercial" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form1.control}
                      name="nif"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIF/CIF *</FormLabel>
                          <FormControl>
                            <Input placeholder="B12345678" {...field} />
                          </FormControl>
                          <FormDescription>
                            Se validará automáticamente según el formato español
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form1.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección *</FormLabel>
                          <FormControl>
                            <Input placeholder="Calle Principal, 123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form1.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código postal *</FormLabel>
                            <FormControl>
                              <Input placeholder="28001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form1.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ciudad *</FormLabel>
                            <FormControl>
                              <Input placeholder="Madrid" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form1.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provincia *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una provincia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROVINCES.map((p) => (
                                <SelectItem key={p.code} value={p.name}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form1.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+34 600 000 000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form1.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de contacto *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contacto@tuempresa.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* PASO 2: Logo */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Upload className="h-6 w-6 text-primary-600" />
                  <div>
                    <CardTitle>Logo de tu empresa</CardTitle>
                    <CardDescription>
                      Aparecerá en tus facturas. Formatos: JPG, PNG, SVG
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-32 w-32 rounded-lg object-contain border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -right-2 -top-2"
                        onClick={() => {
                          setLogo(null);
                          setLogoPreview('');
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-600 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Haz clic o arrastra tu logo aquí</p>
                      <p className="text-xs text-gray-500">PNG, JPG, SVG (máx. 2MB)</p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleLogoChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* PASO 3: Configuración de facturación */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary-600" />
                  <div>
                    <CardTitle>Configuración de facturación</CardTitle>
                    <CardDescription>Define cómo se numerarán tus facturas</CardDescription>
                  </div>
                </div>

                <Form {...form3}>
                  <form className="space-y-4">
                    <FormField
                      control={form3.control}
                      name="invoicePrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prefijo de factura</FormLabel>
                          <FormControl>
                            <Input placeholder="F-" {...field} />
                          </FormControl>
                          <FormDescription>
                            Puedes dejarlo como "F-" o personalizarlo (ej: "FACT-", "INV-")
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form3.control}
                      name="nextInvoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Siguiente número</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Primera factura: {form3.watch('invoicePrefix')}2026-
                            {String(form3.watch('nextInvoiceNumber') || 1).padStart(4, '0')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form3.control}
                      name="defaultPaymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de pago por defecto</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un método" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TRANSFER">Transferencia bancaria</SelectItem>
                              <SelectItem value="CASH">Efectivo</SelectItem>
                              <SelectItem value="CARD">Tarjeta</SelectItem>
                              <SelectItem value="DIRECT_DEBIT">Domiciliación bancaria</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            )}

            {/* PASO 4: Certificado digital */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Check className="h-6 w-6 text-primary-600" />
                  <div>
                    <CardTitle>Certificado digital</CardTitle>
                    <CardDescription>
                      Necesario para enviar facturas a Hacienda automáticamente
                    </CardDescription>
                  </div>
                </div>

                <div className="rounded-lg border bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>¿Qué es esto?</strong> El certificado digital te permite firmar tus
                    facturas electrónicamente y enviarlas a la AEAT de forma automática, cumpliendo
                    con VeriFactu.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Archivo de certificado (.pfx / .p12)
                    </label>
                    <input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={handleCertificateChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100"
                    />
                    {certificate && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ Certificado cargado: {certificate.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contraseña del certificado
                    </label>
                    <Input
                      type="password"
                      placeholder="Introduce la contraseña"
                      value={certificatePassword}
                      onChange={(e) => setCertificatePassword(e.target.value)}
                    />
                  </div>

                  <div className="text-sm">
                    <a
                      href="https://www.sede.fnmt.gob.es/certificados/persona-juridica"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      ¿Cómo obtener un certificado digital? →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 5: Datos bancarios */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary-600" />
                  <div>
                    <CardTitle>Datos bancarios</CardTitle>
                    <CardDescription>
                      Aparecerán en tus facturas para que tus clientes sepan dónde pagar
                    </CardDescription>
                  </div>
                </div>

                <Form {...form5}>
                  <form className="space-y-4">
                    <FormField
                      control={form5.control}
                      name="iban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IBAN</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ES00 0000 0000 0000 0000 0000"
                              {...field}
                              onChange={(e) => {
                                // Formatear IBAN automáticamente
                                const value = e.target.value.replace(/\s/g, '');
                                const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form5.control}
                      name="accountHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titular de la cuenta</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del titular" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="mt-8 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Atrás
              </Button>

              <div className="flex gap-2">
                {(currentStep === 2 || currentStep === 4 || currentStep === 5) && (
                  <Button type="button" variant="ghost" onClick={handleSkip}>
                    {currentStep === 5 ? 'Configurar más tarde' : 'Saltar este paso'}
                  </Button>
                )}

                <Button type="button" onClick={handleNext}>
                  {currentStep === 5 ? 'Finalizar' : 'Continuar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
