import {
  isEmail,
  isPhoneNumber,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isEmailOrPhoneNumber', async: false })
export class IsEmailOrPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    return isEmail(value) || isPhoneNumber(value);
  }

  defaultMessage() {
    return 'The value must be a valid email address or a valid phone number';
  }
}

export function IsEmailOrPhoneNumber(validationOptions?: ValidationOptions) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailOrPhoneNumberConstraint,
    });
  };
}
