-- Enable Row Level Security on all tables (except tenants)
-- This is a SECOND layer of security in addition to filtering by tenant_id in code

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_customers ON customers
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_products ON products
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Enable RLS on invoice_series table
ALTER TABLE invoice_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_invoice_series ON invoice_series
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Enable RLS on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_invoices ON invoices
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Enable RLS on invoice_lines table
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_invoice_lines ON invoice_lines
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Enable RLS on verifactu_logs table
ALTER TABLE verifactu_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_verifactu_logs ON verifactu_logs
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- NOTE: tenants table does NOT have RLS enabled
-- The tenant is selected at login time and stored in the JWT
