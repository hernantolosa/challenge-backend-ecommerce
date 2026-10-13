export const Scope = {
  STOCK_READ: 'stock:read',
  STOCK_WRITE: 'stock:write',
} as const;

export type Scope = (typeof Scope)[keyof typeof Scope];
