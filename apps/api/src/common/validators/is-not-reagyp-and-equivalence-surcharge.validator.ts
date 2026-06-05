import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validates that a customer does NOT have both `isReagyp` and `hasEquivalenceSurcharge`
 * set to true simultaneously. These two fiscal regimes are mutually exclusive in Spain.
 *
 * REAGYP (agricultural compensation) and Recargo de Equivalencia (retail surcharge) apply
 * to fundamentally different types of taxpayers and cannot coexist on the same customer.
 */
@ValidatorConstraint({ name: 'IsNotReagypAndEquivalenceSurcharge', async: false })
export class IsNotReagypAndEquivalenceSurchargeConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;
    return !(obj.isReagyp === true && obj.hasEquivalenceSurcharge === true);
  }

  defaultMessage(): string {
    return 'Un cliente no puede estar simultáneamente en REAGYP y en Recargo de Equivalencia (son regímenes fiscales mutuamente excluyentes)';
  }
}

export function IsNotReagypAndEquivalenceSurcharge(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotReagypAndEquivalenceSurchargeConstraint,
    });
  };
}
