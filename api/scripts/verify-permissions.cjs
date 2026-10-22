const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL=([^\r\n]+)/);
const pool = new Pool({ connectionString: match[1].trim() });

async function checkPermissions() {
  console.log('=== 3. DATABASE PERMISSIONS & ROLE AUDIT ===');

  // 1. Role Attributes
  const roles = await pool.query(`
    SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolconnlimit 
    FROM pg_roles 
    WHERE rolname IN ('aage_app', 'postgres')
    ORDER BY rolname ASC
  `);
  console.log('Role Attributes:');
  roles.rows.forEach(r => {
    console.log(`- ${r.rolname}: superuser=${r.rolsuper}, login=${r.rolcanlogin}, createDb=${r.rolcreatedb}, createRole=${r.rolcreaterole}`);
  });

  // 2. Schema Privileges on public
  const schemaPrivs = await pool.query(`
    SELECT nspname, has_schema_privilege('aage_app', nspname, 'USAGE') as can_usage,
           has_schema_privilege('aage_app', nspname, 'CREATE') as can_create
    FROM pg_namespace
    WHERE nspname = 'public'
  `);
  console.log('\nSchema Privileges (public):', schemaPrivs.rows);

  // 3. Database Privileges
  const dbPrivs = await pool.query(`
    SELECT datname, has_database_privilege('aage_app', datname, 'CONNECT') as can_connect,
           has_database_privilege('aage_app', datname, 'CREATE') as can_create_temp
    FROM pg_database
    WHERE datname = 'aageonline_dev'
  `);
  console.log('\nDatabase Privileges (aageonline_dev):', dbPrivs.rows);

  // 4. Table Privileges summary
  const tablePrivs = await pool.query(`
    SELECT privilege_type, COUNT(*) as table_count
    FROM information_schema.role_table_grants
    WHERE grantee = 'aage_app' AND table_schema = 'public'
    GROUP BY privilege_type
    ORDER BY privilege_type ASC
  `);
  console.log('\nTable Privileges Breakdown for aage_app:');
  tablePrivs.rows.forEach(p => {
    console.log(`- ${p.privilege_type}: on ${p.table_count} tables`);
  });

  await pool.end();
}

checkPermissions().catch(err => {
  console.error(err);
  process.exit(1);
});
