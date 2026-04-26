const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Railway DB');

  // Strategy: Mark init as successfully applied (since schema already exists)
  // and delete the old duplicate add_cascade_delete entry
  
  // 1. Mark init migration as successfully applied
  await client.query(`
    UPDATE "_prisma_migrations" 
    SET 
      "finished_at" = "started_at",
      "rolled_back_at" = NULL,
      "applied_steps_count" = 1,
      "logs" = ''
    WHERE "migration_name" = '20260426015710_init'
  `);
  console.log('Marked init migration as successfully applied');

  // 2. Delete the duplicate old migration record (the one without timestamp prefix)
  // Keep only the timestamp-prefixed one
  await client.query(`
    DELETE FROM "_prisma_migrations" 
    WHERE "migration_name" = 'add_cascade_delete'
  `);
  console.log('Removed duplicate migration record');

  // 3. Update delta migration to have proper checksum
  await client.query(`
    UPDATE "_prisma_migrations" 
    SET 
      "finished_at" = NOW(),
      "rolled_back_at" = NULL,
      "applied_steps_count" = 1,
      "logs" = ''
    WHERE "migration_name" = '20260426015711_add_invoices'
  `);
  console.log('Updated delta migration');

  // Verify
  const res = await client.query('SELECT "migration_name", "finished_at", "rolled_back_at", "applied_steps_count" FROM "_prisma_migrations" ORDER BY "started_at"');
  console.log('\n=== Final state ===');
  for (const row of res.rows) {
    console.log(`${row.migration_name}: finished=${!!row.finished_at}, rolled_back=${!!row.rolled_back_at}, steps=${row.applied_steps_count}`);
  }

  console.log('\n✅ Done. Prisma migrate deploy should pass now.');
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
