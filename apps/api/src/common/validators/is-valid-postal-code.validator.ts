import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validatePostalCode } from '@easyfactura/shared-validators';

@ValidatorConstraint({ name: 'isValidSpanishPostalCode', async: false })
export class IsValidSpanishPostalCodeConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return false;
    const result = validatePostalCode(value);
    return result.isValid;
  }

  defaultMessage() {
    return 'El código postal no es válido';
  }
}

export function IsValidSpanishPostalCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSpanishPostalCodeConstraint,
    });
  };
}
