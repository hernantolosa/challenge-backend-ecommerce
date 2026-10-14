export const IDEMPOTENCY_CONSTRAINT = 'UQ_stock_movements_created_by_idempotency_key';

export const APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL = `
  WITH target AS (
    SELECT level.variant_id, level.on_hand
    FROM stock_levels AS level
    JOIN variants AS variant ON variant.id = level.variant_id
    WHERE variant.sku = $1
    FOR UPDATE OF level
  ),
  adjusted AS (
    UPDATE stock_levels AS level
    SET on_hand = target.on_hand + $2, updated_at = now()
    FROM target
    WHERE level.variant_id = target.variant_id
      AND target.on_hand::bigint + $2 BETWEEN 0 AND $7
    RETURNING level.variant_id, level.on_hand
  ),
  appended AS (
    INSERT INTO stock_movements (variant_id, quantity, reason, balance_after, created_by, idempotency_key)
    SELECT adjusted.variant_id, $3, $4, adjusted.on_hand, $5, $6
    FROM adjusted
    RETURNING id, balance_after, occurred_at
  )
  SELECT
    target.on_hand AS "onHand",
    appended.id,
    appended.balance_after AS "balanceAfter",
    appended.occurred_at AS "occurredAt"
  FROM target
  LEFT JOIN appended ON true
`;

export const FIND_LEVEL_SQL = `
  SELECT variant.sku, level.on_hand AS "onHand"
  FROM variants AS variant
  JOIN stock_levels AS level ON level.variant_id = variant.id
  WHERE variant.sku = $1
`;

export const FIND_MOVEMENT_SQL = `
  SELECT
    movement.id,
    variant.sku,
    movement.quantity,
    movement.reason,
    movement.balance_after AS "balanceAfter",
    movement.created_by AS "createdBy",
    movement.idempotency_key AS "idempotencyKey",
    movement.occurred_at AS "occurredAt"
  FROM stock_movements AS movement
  JOIN variants AS variant ON variant.id = movement.variant_id
  WHERE movement.created_by = $1 AND movement.idempotency_key = $2
`;
