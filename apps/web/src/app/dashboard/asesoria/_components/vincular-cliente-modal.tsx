'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Search,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
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
import { useCheckIdentifier, useInviteClient } from '@/hooks/use-agency';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { validateNif } from '@easyfactura/shared-validators';
import { brandConfig } from '@easyfactura/brand-config';

// ==================== HELPERS ====================

/** Masks an email for display: john.doe@company.com → jo*****@company.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

/**
 * Validates if the input (non-email) is a syntactically valid NIF/NIE/CIF.
 * Returns null if valid, or an error message if not.
 */
function getNifValidationError(value: string): string | null {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length < 9) return null; // still typing, no error yet
  const result = validateNif(trimmed);
  if (result.isValid) return null;
  return 'El NIF/DNI/CIF introducido no es válido. Comprueba que no haya errores tipográficos.';
}

// ==================== SUB-COMPONENTS ====================

interface ResultCardProps {
  businessName: string;
  nif: string;
  email: string;
  city: string | null;
  province: string | null;
}

function UserFoundCard({ businessName, nif, email, city, province }: ResultCardProps) {
  const location = [city, province].filter(Boolean).join(', ');
  return (
    <div className="flex items-center gap-3 rounded-xl border border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-800/50 dark:bg-secondary-950/20">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-100 font-bold text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300">
        {businessName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold leading-tight">{businessName}</p>
        <p className="font-mono text-xs text-muted-foreground">{nif}</p>
        {location && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {location}
          </div>
        )}
        {email && <p className="text-xs text-muted-foreground">{maskEmail(email)}</p>}
      </div>
      <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-secondary-600 dark:text-secondary-400" />
    </div>
  );
}

// ==================== MODAL ====================

type FlowStep =
  | { type: 'idle' }
  | { type: 'not_found_nif'; nif: string }
  | { type: 'invite_email_form'; nif: string; email: string };

interface VincularClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VincularClienteModal({ isOpen, onClose }: VincularClienteModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [flowStep, setFlowStep] = useState<FlowStep>({ type: 'idle' });

  const debouncedQuery = useDebounce(query, 400);
  const { data: checkResult, isFetching: isChecking } = useCheckIdentifier(debouncedQuery);
  const { mutate: inviteClient, isPending: isInviting } = useInviteClient();

  const isNifInput = !query.includes('@');
  const isEmailInput = query.includes('@');
  const isPartialEmail = isEmailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim());
  const nifValidationError = isNifInput ? getNifValidationError(query) : null;
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setInviteEmailInput('');
      setFlowStep({ type: 'idle' });
    }
  }, [isOpen]);

  // Sync flowStep when check result changes
  useEffect(() => {
    if (checkResult?.status === 'AVAILABLE' && checkResult.identifierType === 'nif') {
      setFlowStep({ type: 'not_found_nif', nif: debouncedQuery.trim().toUpperCase() });
    } else if (checkResult?.status !== 'AVAILABLE') {
      setFlowStep({ type: 'idle' });
    }
  }, [checkResult, debouncedQuery]);

  const handleVincular = useCallback(() => {
    if (!checkResult || checkResult.status !== 'EXISTS_CAN_INVITE') return;
    inviteClient(
      { inviteeEmail: checkResult.email },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  }, [checkResult, inviteClient, onClose]);

  const handleSendInviteByEmail = useCallback(
    (email: string) => {
      if (!email) return;
      inviteClient(
        { inviteeEmail: email },
        {
          onSuccess: () => {
            onClose();
          },
        },
      );
    },
    [inviteClient, onClose],
  );

  const handleGoToDirectClient = useCallback(
    (nif: string) => {
      onClose();
      router.push(`/dashboard/asesoria/clientes/nuevo?nif=${encodeURIComponent(nif)}`);
    },
    [onClose, router],
  );

  const showSpinner =
    isChecking && (debouncedQuery.includes('@') || debouncedQuery.trim().length >= 9);
  const isInputTooShort =
    query.trim().length > 0 && query.trim().length < 9 && !query.includes('@');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-customer-600" />
            Vincular cliente
          </DialogTitle>
          <DialogDescription>
            Introduce el NIF/DNI o el email del cliente para buscarlo en {brandConfig.app.name}.
          </DialogDescription>
        </DialogHeader>

        {/* ── Search input ── */}
        <div className="space-y-1.5">
          <Label htmlFor="identifier-input">NIF/DNI o email del cliente</Label>
          <div className="relative">
            {showSpinner ? (
              <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              id="identifier-input"
              className="pl-9"
              placeholder="B12345678 o cliente@empresa.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          {isInputTooShort && (
            <p className="text-xs text-muted-foreground">
              Un NIF/DNI válido tiene al menos 9 caracteres.
            </p>
          )}
          {isPartialEmail && (
            <p className="text-xs text-muted-foreground">
              Escribe el email completo para buscar (ej: nombre@empresa.com).
            </p>
          )}
          {nifValidationError && !isInputTooShort && (
            <div className="flex items-start gap-1.5 text-xs text-destructive">
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {nifValidationError}
            </div>
          )}
        </div>

        {/* ── Results area ── */}
        {checkResult && !isChecking && !nifValidationError && (
          <div className="space-y-3">
            {/* User found — can invite */}
            {checkResult.status === 'EXISTS_CAN_INVITE' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Hemos encontrado este usuario. ¿Es el cliente que quieres vincular?
                </p>
                <UserFoundCard
                  businessName={checkResult.businessName}
                  nif={checkResult.nif}
                  email={checkResult.email}
                  city={checkResult.city}
                  province={checkResult.province}
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={isInviting}
                  >
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleVincular} disabled={isInviting}>
                    {isInviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      <>
                        Sí, vincular
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Already in portfolio */}
            {checkResult.status === 'ALREADY_IN_PORTFOLIO' && (
              <div className="flex items-start gap-3 rounded-xl border border-proforma-200 bg-proforma-50 p-4 dark:border-proforma-800/50 dark:bg-proforma-950/20">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-proforma-600 dark:text-proforma-400" />
                <div>
                  <p className="text-sm font-semibold text-proforma-900 dark:text-proforma-200">
                    Ya está en tu cartera
                  </p>
                  <p className="mt-0.5 text-xs text-proforma-700 dark:text-proforma-300">
                    <strong>{checkResult.businessName}</strong> ({checkResult.nif}) ya forma parte
                    de tus clientes.
                  </p>
                </div>
              </div>
            )}

            {/* Not found — email search */}
            {checkResult.status === 'AVAILABLE' && checkResult.identifierType === 'email' && (
              <div className="space-y-3">
                <div className="rounded-xl border border-dashed p-4 text-center">
                  <p className="text-sm font-medium">No encontramos ningún usuario con ese email</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Podemos enviarle una invitación para que se registre y se vincule contigo.
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSendInviteByEmail(debouncedQuery.trim())}
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando invitación...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar invitación a {debouncedQuery.trim()}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Not found by NIF — two-option flow ── */}
        {flowStep.type === 'not_found_nif' &&
          !isChecking &&
          !nifValidationError &&
          query.trim().toUpperCase() === flowStep.nif && (
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed p-4 text-center">
                <p className="text-sm font-medium">Ningún usuario registrado con ese NIF</p>
                <p className="mt-1 text-xs text-muted-foreground">¿Cómo quieres proceder?</p>
              </div>

              <div className="grid gap-2">
                {/* Option 1: Create directly */}
                <button
                  type="button"
                  onClick={() => handleGoToDirectClient(flowStep.nif)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                    'hover:border-primary/50 hover:bg-muted/40',
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-customer-100 text-customer-600 dark:bg-customer-950 dark:text-customer-400">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Crear cliente directamente</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Tú gestionas su cuenta. Ideal si el cliente no usa {brandConfig.app.name}.
                    </p>
                  </div>
                  <ArrowRight className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                </button>

                {/* Option 2: Send invitation by email */}
                {flowStep.type === 'not_found_nif' && (
                  <button
                    type="button"
                    onClick={() =>
                      setFlowStep({
                        type: 'invite_email_form',
                        nif: flowStep.nif,
                        email: '',
                      })
                    }
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                      'hover:border-primary/50 hover:bg-muted/40',
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-agency-100 text-agency-600 dark:bg-agency-950 dark:text-agency-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Enviar invitación por email</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        El cliente recibirá un enlace para crear su cuenta y vincularse contigo.
                      </p>
                    </div>
                    <ArrowRight className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </button>
                )}
              </div>
            </div>
          )}

        {/* ── Invite by email form (after choosing option 2 from NIF not found) ── */}
        {flowStep.type === 'invite_email_form' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setFlowStep({ type: 'not_found_nif', nif: flowStep.nif })}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              ← Volver
            </button>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email del cliente</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="cliente@empresa.com"
                value={inviteEmailInput}
                onChange={(e) => setInviteEmailInput(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Recibirá un enlace de invitación válido durante 7 días.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={isInviting}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={isInviting || !inviteEmailInput.includes('@')}
                onClick={() => handleSendInviteByEmail(inviteEmailInput)}
              >
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar invitación
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
