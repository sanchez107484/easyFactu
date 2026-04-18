/**
 * Script to copy all data from one Supabase PostgreSQL database to another.
 * The destination database must already have the schema created (via prisma migrate deploy).
 *
 * Usage: node scripts/copy-database.js
 */

const { Client } = require('pg');

// Source database (PRO)
const SOURCE_URL = 'postgresql://postgres:JavierLuis123.!@db.dyutrhzwvutitrlbywaa.supabase.co:5432/postgres';

// Destination database (PRE)
const DEST_URL = 'postgresql://postgres:JavierLuis123.!@db.mouyanpojypvlyaogqdw.supabase.co:5432/postgres';

// Tables in order respecting foreign key dependencies (parents first)
const TABLES = [
    'tenants',
    'users',
    'tenant_users',
    'customers',
    'products',
    'invoice_templates',
    'invoice_series',
    'invoice_defaults',
    'invoices',
    'invoice_lines',
    'payments',
    'verifactu_logs',
    'invoice_note_logs',
    'recurring_invoices',
    'recurring_invoice_lines',
];

async function copyTable(sourceClient, destClient, tableName) {
    // Get row count
    const countResult = await sourceClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    const rowCount = parseInt(countResult.rows[0].count, 10);

    if (rowCount === 0) {
        console.log(`  ⏭  ${tableName}: 0 rows (skipped)`);
        return 0;
    }

    // Get all data from source
    const sourceData = await sourceClient.query(`SELECT * FROM "${tableName}"`);
    const rows = sourceData.rows;
    const columns = sourceData.fields.map(f => f.name);

    // Build parameterized INSERT
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const values = [];
        const placeholders = [];

        batch.forEach((row, batchIdx) => {
            const rowPlaceholders = columns.map((col, colIdx) => {
                values.push(row[col]);
                return `$${batchIdx * columns.length + colIdx + 1}`;
            });
            placeholders.push(`(${rowPlaceholders.join(', ')})`);
        });

        const quotedColumns = columns.map(c => `"${c}"`).join(', ');
        const insertSQL = `INSERT INTO "${tableName}" (${quotedColumns}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`;

        await destClient.query(insertSQL, values);
        inserted += batch.length;
    }

    console.log(`  ✅ ${tableName}: ${inserted} rows copied`);
    return inserted;
}

async function main() {
    console.log('🔄 Connecting to source database...');
    const sourceClient = new Client({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
    await sourceClient.connect();
    console.log('  Connected to source.');

    console.log('🔄 Connecting to destination database...');
    const destClient = new Client({ connectionString: DEST_URL, ssl: { rejectUnauthorized: false } });
    await destClient.connect();
    console.log('  Connected to destination.');

    // Disable triggers temporarily to avoid constraint issues during bulk insert
    await destClient.query('SET session_replication_role = replica;');

    console.log('\n📋 Copying tables...\n');

    let totalRows = 0;
    for (const table of TABLES) {
        try {
            const count = await copyTable(sourceClient, destClient, table);
            totalRows += count;
        } catch (error) {
            console.error(`  ❌ Error copying ${table}:`, error.message);
        }
    }

    // Re-enable triggers
    await destClient.query('SET session_replication_role = DEFAULT;');

    // Reset sequences to match the data
    console.log('\n🔧 Resetting sequences...');
    const seqResult = await destClient.query(`
    SELECT schemaname, sequencename FROM pg_sequences WHERE schemaname = 'public'
  `);
    for (const seq of seqResult.rows) {
        try {
            // Find the table and column this sequence belongs to
            const depResult = await destClient.query(`
        SELECT d.refobjid::regclass AS table_name, a.attname AS column_name
        FROM pg_depend d
        JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
        WHERE d.objid = '${seq.schemaname}.${seq.sequencename}'::regclass
        AND d.deptype = 'a'
      `);
            if (depResult.rows.length > 0) {
                const { table_name, column_name } = depResult.rows[0];
                await destClient.query(`
          SELECT setval('"${seq.sequencename}"', COALESCE((SELECT MAX("${column_name}") FROM ${table_name}), 1))
        `);
            }
        } catch {
            // Some sequences may not have direct table dependencies
        }
    }

    console.log(`\n✨ Done! ${totalRows} total rows copied across ${TABLES.length} tables.`);

    await sourceClient.end();
    await destClient.end();
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
