import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_ENVELOPE_KEY = 'skipResponseEnvelope';

/**
 * Returns the handler result as is, without the `{ success, data, meta }` envelope
 * added by TransformInterceptor. Used by public contracts such as the integrations API.
 */
export const SkipResponseEnvelope = () => SetMetadata(SKIP_RESPONSE_ENVELOPE_KEY, true);
