'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { brandConfig } from '@easyfactura/brand-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';

const recoverSchema = z.object({
  email: z.string().email('Email inválido'),
});

type RecoverFormData = z.infer<typeof recoverSchema>;

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<RecoverFormData>({
    resolver: zodResolver(recoverSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RecoverFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implementar endpoint de recuperación de contraseña
      // await authApi.requestPasswordReset(data.email);

      // Por ahora, simulamos éxito
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setEmailSent(true);
      toast.success('Email enviado. Revisa tu bandeja de entrada.');
    } catch (error) {
      toast.error('Error al enviar el email. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Recuperar contraseña</CardTitle>
            <div
              className="flex items-center justify-center rounded-lg p-2"
              style={{ backgroundColor: brandConfig.colors.primary[600] }}
            >
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardDescription>
            {emailSent
              ? 'Revisa tu email para restablecer tu contraseña'
              : 'Introduce tu email para recibir instrucciones'}
          </CardDescription>
        </CardHeader>

        {emailSent ? (
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center">
              <p className="text-sm text-green-800 dark:text-green-200">
                Hemos enviado un email a <strong>{form.getValues('email')}</strong> con
                instrucciones para restablecer tu contraseña.
              </p>
              <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                Si no recibes el email en unos minutos, revisa tu carpeta de spam.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
              Enviar a otro email
            </Button>
          </CardContent>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="tu@email.com"
                          disabled={isLoading}
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  style={{
                    backgroundColor: isLoading ? undefined : brandConfig.colors.primary[600],
                  }}
                >
                  {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
                </Button>

                <Link
                  href="/login"
                  className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Volver al login
                </Link>
              </CardFooter>
            </form>
          </Form>
        )}
      </Card>
    </div>
  );
}
