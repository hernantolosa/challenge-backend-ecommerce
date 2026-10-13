export function exhaustiveMatchGuard(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
