const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('=== Checking _prisma_migrations table ===\n');
  
  const res = await client.query('SELECT * FROM "_prisma_migrations" ORDER BY "started_at"');
  for (const row of res.rows) {
    console.log('Migration:', row.migration_name);
    console.log('  started_at:', row.started_at);
    console.log('  finished_at:', row.finished_at);
    console.log('  rolled_back_at:', row.rolled_back_at);
    console.log('  applied_steps_count:', row.applied_steps_count);
    console.log('  checksum:', row.checksum);
    console.log('  logs:', row.logs?.substring(0, 100));
    console.log('---');
  }
  
  // Check if there's a composite index / unique constraint issue
  console.log('\n=== Table structure ===');
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = '_prisma_migrations'
  `);
  for (const c of cols.rows) {
    console.log(c.column_name, ':', c.data_type);
  }
  
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
