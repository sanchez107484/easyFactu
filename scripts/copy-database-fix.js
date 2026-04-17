/**
 * Script to fix the remaining data copy issues:
 * 1. Copy invoices excluding the extra column that doesn't exist in destination
 * 2. Copy payments table
 */

const { Client } = require('pg');

const SOURCE_URL = 'postgresql://postgres.wbuzwyoxekfncjfmocbu:Vivadeco20%21@aws-1-eu-west-2.pooler.supabase.com:5432/postgres';
const DEST_URL = 'postgresql://postgres:JavierLuis123.!@db.dyutrhzwvutitrlbywaa.supabase.co:5432/postgres';

async function main() {
    const sourceClient = new Client({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
    const destClient = new Client({ connectionString: DEST_URL, ssl: { rejectUnauthorized: false } });

    await sourceClient.connect();
    await destClient.connect();
    console.log('Connected to both databases.');

    // Disable triggers
    await destClient.query('SET session_replication_role = replica;');

    // 1. Check what columns exist in source invoices
    const srcCols = await sourceClient.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'invoices' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
    console.log('\nSource invoices columns:', srcCols.rows.map(r => r.column_name).join(', '));

    // Check what columns exist in dest invoices
    const destCols = await destClient.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'invoices' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
    console.log('Dest invoices columns:', destCols.rows.map(r => r.column_name).join(', '));

    // Find common columns (exist in both)
    const srcColSet = new Set(srcCols.rows.map(r => r.column_name));
    const destColSet = new Set(destCols.rows.map(r => r.column_name));
    const commonColumns = [...srcColSet].filter(c => destColSet.has(c));
    console.log('\nCommon columns:', commonColumns.join(', '));

    // Copy invoices using only common columns
    const quotedCols = commonColumns.map(c => `"${c}"`).join(', ');
    const sourceInvoices = await sourceClient.query(`SELECT ${quotedCols} FROM invoices`);
    console.log(`\nCopying ${sourceInvoices.rows.length} invoices...`);

    if (sourceInvoices.rows.length > 0) {
        const batchSize = 50;
        let copied = 0;
        for (let i = 0; i < sourceInvoices.rows.length; i += batchSize) {
            const batch = sourceInvoices.rows.slice(i, i + batchSize);
            const values = [];
            const placeholders = [];

            batch.forEach((row, batchIdx) => {
                const rowPlaceholders = commonColumns.map((col, colIdx) => {
                    values.push(row[col]);
                    return `$${batchIdx * commonColumns.length + colIdx + 1}`;
                });
                placeholders.push(`(${rowPlaceholders.join(', ')})`);
            });

            const insertSQL = `INSERT INTO "invoices" (${quotedCols}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`;
            await destClient.query(insertSQL, values);
            copied += batch.length;
        }
        console.log(`  ✅ invoices: ${copied} rows copied`);
    }

    // 2. Check if payments table exists in source
    const paymentsExists = await sourceClient.query(`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public')
  `);

    if (paymentsExists.rows[0].exists) {
        const paymentsData = await sourceClient.query('SELECT * FROM payments');
        if (paymentsData.rows.length > 0) {
            const columns = paymentsData.fields.map(f => f.name);
            const quotedPayCols = columns.map(c => `"${c}"`).join(', ');
            const values = [];
            const placeholders = [];

            paymentsData.rows.forEach((row, rowIdx) => {
                const rowPlaceholders = columns.map((col, colIdx) => {
                    values.push(row[col]);
                    return `$${rowIdx * columns.length + colIdx + 1}`;
                });
                placeholders.push(`(${rowPlaceholders.join(', ')})`);
            });

            const insertSQL = `INSERT INTO "payments" (${quotedPayCols}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`;
            await destClient.query(insertSQL, values);
            console.log(`  ✅ payments: ${paymentsData.rows.length} rows copied`);
        } else {
            console.log('  ⏭  payments: 0 rows (skipped)');
        }
    } else {
        console.log('  ℹ️  payments table does not exist in source');
    }

    // Re-enable triggers
    await destClient.query('SET session_replication_role = DEFAULT;');

    console.log('\n✨ Fix complete!');

    await sourceClient.end();
    await destClient.end();
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
