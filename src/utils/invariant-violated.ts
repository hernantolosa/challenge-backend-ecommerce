export interface InvariantViolated {
  readonly kind: 'InvariantViolated';
  readonly field: string;
  readonly message: string;
}

export const InvariantViolated = {
  make(field: string, message: string): InvariantViolated {
    return { kind: 'InvariantViolated', field, message };
  },
};
