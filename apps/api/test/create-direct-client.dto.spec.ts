import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AccountType } from '@easyfactura/shared-types';
import { CreateDirectClientDto } from '../src/modules/agency/dto/create-direct-client.dto';

async function accountTypeErrors(accountType: AccountType | undefined) {
  const dto = plainToInstance(CreateDirectClientDto, {
    accountType,
    businessName: 'Cliente de prueba',
    nif: '12345678Z',
    email: 'cliente@example.com',
  });
  const errors = await validate(dto);
  return errors.filter((error) => error.property === 'accountType');
}

describe('CreateDirectClientDto.accountType', () => {
  it('rejects creating an agency as a client', async () => {
    expect(await accountTypeErrors(AccountType.AGENCY)).toHaveLength(1);
  });

  it.each([AccountType.INDIVIDUAL, AccountType.BUSINESS, AccountType.COLLABORATIVE, undefined])(
    'accepts %s',
    async (accountType) => {
      expect(await accountTypeErrors(accountType)).toHaveLength(0);
    }
  );
});
