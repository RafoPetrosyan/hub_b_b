import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const IANATimezones = new Set(
  Intl.supportedValuesOf('timeZone'),
);

@ValidatorConstraint({ name: 'IsIanaTimezone', async: false })
export class IsEmailOrPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    return (
      typeof value === 'string' &&
      IANATimezones.has(value)
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid IANA timezone`;
  }
}

export function IsIanaTimezone(
  validationOptions?: ValidationOptions,
) {
  return function(object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsIanaTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsEmailOrPhoneNumberConstraint,
    });
  };
}
