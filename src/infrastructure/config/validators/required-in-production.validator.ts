import { registerDecorator, type ValidationArguments } from 'class-validator';
import { RuntimeEnvironment } from '@infrastructure/config/enums/runtime-environment';

export function RequiredInProduction(
  message: string,
  isAcceptable: (value: unknown) => boolean,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'requiredInProduction',
      target: target.constructor,
      propertyName: String(propertyName),
      options: { message },
      validator: {
        validate: (value: unknown, args: ValidationArguments): boolean =>
          !isProduction(args.object) || isAcceptable(value),
      },
    });
  };
}

function isProduction(environment: object): boolean {
  return 'NODE_ENV' in environment && environment.NODE_ENV === RuntimeEnvironment.PRODUCTION;
}
