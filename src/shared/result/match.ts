export function exhaustiveMatchGuard(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

export function unreachable(reason: string): never {
  throw new Error(`Unreachable state: ${reason}`);
}
