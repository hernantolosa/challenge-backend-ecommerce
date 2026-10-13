import { registerDecorator } from 'class-validator';

const MIN_LENGTH = 43;
const MIN_DISTINCT_CHARACTERS = 16;

export function IsStrongSecret(): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isStrongSecret',
      target: target.constructor,
      propertyName: String(propertyName),
      options: {
        message: `$property must have at least ${MIN_LENGTH} characters and ${MIN_DISTINCT_CHARACTERS} distinct ones`,
      },
      validator: { validate: isStrongSecret },
    });
  };
}

function isStrongSecret(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.length >= MIN_LENGTH &&
    new Set(value).size >= MIN_DISTINCT_CHARACTERS
  );
}
