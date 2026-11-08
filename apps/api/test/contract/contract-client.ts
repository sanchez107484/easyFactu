/**
 * Minimal HTTP client for the black-box contract suite. It only knows the public contract:
 * BASE_URL (the apiUrl returned at provisioning) and API_KEY come from the environment.
 */
import { randomUUID } from 'crypto';

export interface ContractResponse<T = Record<string, unknown>> {
  status: number;
  headers: Headers;
  body: T;
  raw: ArrayBuffer;
}

export interface RequestOptions {
  body?: unknown;
  idempotencyKey?: string | null;
  apiKey?: string | null;
  requestId?: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`Set ${name} to run the contract suite (see test/contract/README.md)`);
  return value;
}

export const BASE_URL = requiredEnv('BASE_URL').replace(/\/+$/, '');
export const API_KEY = requiredEnv('API_KEY');
export const RUN_ID = `${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;

function buildHeaders(method: string, options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json, application/problem+json, application/pdf',
  };
  const apiKey = options.apiKey === undefined ? API_KEY : options.apiKey;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.requestId) headers['X-Request-Id'] = options.requestId;
  const idempotencyKey =
    options.idempotencyKey === undefined && method === 'POST'
      ? randomUUID()
      : options.idempotencyKey;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  return headers;
}

export async function call<T = Record<string, unknown>>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  options: RequestOptions = {}
): Promise<ContractResponse<T>> {
  const response = await fetch(`${BASE_URL}/integrations/v1${path}`, {
    method,
    headers: buildHeaders(method, options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const raw = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('json');
  const body = (isJson && raw.byteLength ? JSON.parse(Buffer.from(raw).toString('utf8')) : {}) as T;
  return { status: response.status, headers: response.headers, body, raw };
}

/** Expected charge per contract: round_half_up(quantity × unitPriceWithTax × (1 − discount%)), in cents. */
export function chargedCents(line: {
  quantity: string;
  unitPriceWithTax: string;
  discountPercent?: string;
}): bigint {
  const scaled = (value: string, scale: number) => {
    const [integer = '0', fraction = ''] = value.split('.');
    return (
      BigInt(integer) * 10n ** BigInt(scale) +
      BigInt(fraction.padEnd(scale, '0').slice(0, scale) || '0')
    );
  };
  const numerator =
    scaled(line.unitPriceWithTax, 2) *
    scaled(line.quantity, 4) *
    (10_000n - scaled(line.discountPercent ?? '0', 2));
  const denominator = 10n ** 8n;
  return (numerator * 2n + denominator) / (denominator * 2n);
}

export function centsToMoney(cents: bigint): string {
  const sign = cents < 0n ? '-' : '';
  const absolute = cents < 0n ? -cents : cents;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`;
}
