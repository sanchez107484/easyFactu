'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, ShieldAlert, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResendActivation } from '@/hooks/use-agency';

interface ExpiredLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientTenantId: string;
  clientEmail: string;
}

export function ExpiredLinkModal({
  isOpen,
  onClose,
  clientTenantId,
  clientEmail,
}: ExpiredLinkModalProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const { mutate: resendActivation, isPending: isResending } = useResendActivation();

  const handleClose = () => {
    setShowEmailForm(false);
    setNewEmail('');
    onClose();
  };

  const handleResend = (email?: string) => {
    resendActivation({ clientTenantId, data: email ? { email } : {} }, { onSuccess: handleClose });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            El enlace de activación ha caducado
          </DialogTitle>
          <DialogDescription>
            El cliente no pudo activar su cuenta a tiempo. Envía un nuevo enlace a{' '}
            <span className="font-mono text-foreground">{clientEmail}</span>.
          </DialogDescription>
        </DialogHeader>

        {!showEmailForm ? (
          <div className="flex flex-col gap-2 pt-1">
            <Button
              variant="outline"
              className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowEmailForm(true)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Cambiar email y reenviar
            </Button>
            <Button className="w-full" onClick={() => handleResend()} disabled={isResending}>
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Enviar nuevo enlace a {clientEmail}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Nuevo email del cliente</Label>
              <Input
                id="new-email"
                type="email"
                placeholder={clientEmail}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEmailForm(false);
                  setNewEmail('');
                }}
                disabled={isResending}
              >
                Volver
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleResend(newEmail)}
                disabled={!newEmail.trim() || isResending}
              >
                {isResending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Enviar enlace
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
