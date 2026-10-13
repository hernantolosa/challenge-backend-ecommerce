export const APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL = `
  WITH adjusted AS (
    UPDATE stock_levels AS level
    SET on_hand = level.on_hand + $2, updated_at = now()
    FROM variants AS variant
    WHERE variant.id = level.variant_id
      AND variant.sku = $1
      AND level.on_hand::bigint + $2 BETWEEN 0 AND $7
    RETURNING level.variant_id, level.on_hand
  )
  INSERT INTO stock_movements (variant_id, quantity, reason, balance_after, actor, idempotency_key)
  SELECT adjusted.variant_id, $3, $4, adjusted.on_hand, $5, $6
  FROM adjusted
  RETURNING id, balance_after AS "balanceAfter", occurred_at AS "occurredAt"
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
    movement.actor,
    movement.idempotency_key AS "idempotencyKey",
    movement.occurred_at AS "occurredAt"
  FROM stock_movements AS movement
  JOIN variants AS variant ON variant.id = movement.variant_id
  WHERE movement.actor = $1 AND movement.idempotency_key = $2
`;
