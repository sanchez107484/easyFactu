-- HU-01 · Registros y usuarios activados por página de entrada y semana.
-- "Activado" = la empresa del usuario ha emitido al menos una factura
-- (cualquier estado posterior a DRAFT; proformas y presupuestos no cuentan).
-- Ejecutar en Supabase (SQL editor, solo lectura).

WITH signups AS (
  SELECT
    u.id AS user_id,
    date_trunc('week', u.created_at)::date AS signup_week,
    COALESCE(u.signup_landing_path, '(sin dato)') AS landing_path,
    tu.tenant_id
  FROM users u
  JOIN tenant_users tu ON tu.user_id = u.id AND tu.is_owner
),
activated_tenants AS (
  SELECT DISTINCT i.tenant_id
  FROM invoices i
  WHERE i.status IN ('CONFIRMED', 'SENT', 'PAID', 'RECTIFIED')
)
SELECT
  s.signup_week,
  s.landing_path,
  COUNT(DISTINCT s.user_id) AS registros,
  COUNT(DISTINCT s.user_id) FILTER (WHERE a.tenant_id IS NOT NULL) AS activados,
  ROUND(
    100.0 * COUNT(DISTINCT s.user_id) FILTER (WHERE a.tenant_id IS NOT NULL)
      / NULLIF(COUNT(DISTINCT s.user_id), 0),
    1
  ) AS tasa_activacion_pct
FROM signups s
LEFT JOIN activated_tenants a ON a.tenant_id = s.tenant_id
GROUP BY s.signup_week, s.landing_path
ORDER BY s.signup_week DESC, registros DESC;
