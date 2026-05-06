import { SetMetadata } from '@nestjs/common';

export const SKIP_AGENCY_GUARD_KEY = 'skipAgencyGuard';

/**
 * Marks a route handler as exempt from the AgencyAccessGuard.
 * Use this on endpoints within AgencyController that are called by clients (non-AGENCY tenants),
 * such as accepting an invitation.
 */
export const SkipAgencyGuard = () => SetMetadata(SKIP_AGENCY_GUARD_KEY, true);
