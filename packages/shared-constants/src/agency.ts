import { AccountType } from '@easyfactura/shared-types';

/** Account types an agency may create for its clients (an agency cannot create another agency). */
export const AGENCY_CLIENT_ACCOUNT_TYPES = [
  AccountType.INDIVIDUAL,
  AccountType.BUSINESS,
  AccountType.COLLABORATIVE,
] as const;

export function isAgencyClientAccountType(type: AccountType): boolean {
  return AGENCY_CLIENT_ACCOUNT_TYPES.some((allowed) => allowed === type);
}
