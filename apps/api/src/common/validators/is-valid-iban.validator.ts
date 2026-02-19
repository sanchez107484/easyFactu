import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validateIban } from '@easyfactura/shared-validators';

@ValidatorConstraint({ name: 'isValidIban', async: false })
export class IsValidIbanConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return false;
    const result = validateIban(value);
    return result.isValid;
  }

  defaultMessage() {
    return 'El IBAN no es válido';
  }
}

export function IsValidIban(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIbanConstraint,
    });
  };
}
