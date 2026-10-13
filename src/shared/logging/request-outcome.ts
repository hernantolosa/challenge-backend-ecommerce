import { type ServerResponse } from 'node:http';

const outcomes = new WeakMap<ServerResponse, string>();

export function recordOutcome(response: ServerResponse, code: string): void {
  outcomes.set(response, code);
}

export function outcomeOf(response: ServerResponse): string {
  return outcomes.get(response) ?? 'Ok';
}
