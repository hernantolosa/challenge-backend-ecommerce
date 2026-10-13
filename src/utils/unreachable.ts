export function unreachable(reason: string): never {
  throw new Error(`Unreachable state: ${reason}`);
}
