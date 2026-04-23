'use client';

import { useRouter } from 'next/navigation';
import { UserPlus, Users, ArrowRight } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnadirClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVincularClick: () => void;
}

interface OptionCardProps {
  icon: React.ElementType;
  iconClassName: string;
  title: string;
  description: string;
  action: React.ReactNode;
}

function OptionCard({ icon: Icon, iconClassName, title, description, action }: OptionCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold leading-snug">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="mt-auto">{action}</div>
    </div>
  );
}

export function AnadirClienteModal({ isOpen, onClose, onVincularClick }: AnadirClienteModalProps) {
  const router = useRouter();

  const handleAddDirectly = () => {
    onClose();
    router.push('/dashboard/asesoria/clientes/nuevo');
  };

  const handleVincular = () => {
    onClose();
    onVincularClick();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-customer-600" />
            Añadir cliente a tu cartera
          </DialogTitle>
          <DialogDescription>
            Elige cómo quieres incorporar al cliente. Puedes crearlo tú mismo o vincularlo si ya
            tiene cuenta en {brandConfig.app.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            icon={UserPlus}
            iconClassName="bg-customer-100 text-customer-600 dark:bg-customer-950 dark:text-customer-400"
            title="Añadir directamente"
            description={`Crea tú el perfil fiscal del cliente. Ideal si el cliente no tiene cuenta en ${brandConfig.app.name}.`}
            action={
              <Button className="w-full" size="sm" onClick={handleAddDirectly}>
                <UserPlus className="mr-2 h-4 w-4" />
                Añadir cliente
              </Button>
            }
          />

          <OptionCard
            icon={Users}
            iconClassName="bg-agency-100 text-agency-600 dark:bg-agency-950 dark:text-agency-400"
            title="Vincular existente"
            description={`Busca al cliente por NIF o email. Si ya usa ${brandConfig.app.name}, se vincula al instante.`}
            action={
              <Button variant="outline" className="w-full" size="sm" onClick={handleVincular}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Vincular cliente
              </Button>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
