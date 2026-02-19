import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validateNif } from '@easyfactura/shared-validators';

@ValidatorConstraint({ name: 'isValidNif', async: false })
export class IsValidNifConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return false;
    const result = validateNif(value);
    return result.isValid;
  }

  defaultMessage() {
    return 'El NIF/CIF/NIE no es válido';
  }
}

export function IsValidNif(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidNifConstraint,
    });
  };
}
