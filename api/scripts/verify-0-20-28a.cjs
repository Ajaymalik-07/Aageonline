const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL=([^\r\n]+)/);
if (!match) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: match[1].trim() });

async function verify() {
  console.log('=== 1. RECONCILE REPORTED EVIDENCE ===');
  
  // Total leads
  const leadCountRes = await pool.query('SELECT COUNT(*) FROM lead_prospects');
  const totalLeads = parseInt(leadCountRes.rows[0].count, 10);
  console.log(`Total lead_prospects in SQL: ${totalLeads}`);

  // Lead columns
  const leadCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'lead_prospects'
    ORDER BY ordinal_position
  `);
  console.log('lead_prospects columns:', leadCols.rows.map(c => c.column_name).join(', '));

  // Inspect leads metadata (without exposing emails/names/phones)
  const leadsMeta = await pool.query(`
    SELECT id, city, category, source, status, discovery_job_id, outreach_eligible, suppressed, created_at, updated_at
    FROM lead_prospects
    ORDER BY created_at ASC
  `);
  console.log(`Leads breakdown count: ${leadsMeta.rows.length}`);
  leadsMeta.rows.forEach((r, idx) => {
    console.log(`Lead #${idx + 1}: id=${r.id}, city=${r.city}, cat=${r.category}, src=${r.source}, status=${r.status}, job=${r.discovery_job_id}, elig=${r.outreach_eligible}, supp=${r.suppressed}, created=${r.created_at.toISOString()}`);
  });

  // Scraper jobs columns
  const jobCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'scraper_jobs'
    ORDER BY ordinal_position
  `);
  console.log('scraper_jobs columns:', jobCols.rows.map(c => c.column_name).join(', '));

  // Scraper jobs
  const jobsRes = await pool.query('SELECT * FROM scraper_jobs ORDER BY created_at ASC');
  console.log(`Total scraper_jobs: ${jobsRes.rows.length}`);
  jobsRes.rows.forEach(j => {
    console.log(`Job: ${JSON.stringify(j)}`);
  });

  // Email outbox
  const outboxCountRes = await pool.query('SELECT COUNT(*) FROM email_outbox');
  const outboxBreakdown = await pool.query('SELECT status, COUNT(*) FROM email_outbox GROUP BY status');
  console.log(`Total email_outbox rows: ${outboxCountRes.rows[0].count}`);
  console.log('Outbox breakdown by status:', outboxBreakdown.rows);

  // Lead 24 investigation
  const lead24 = await pool.query("SELECT * FROM lead_prospects WHERE id = 'lead-1791887191593-bsmj'");
  console.log('Lead #24 details:', JSON.stringify(lead24.rows[0], null, 2));

  // Email outbox columns
  const outboxCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'email_outbox'
    ORDER BY ordinal_position
  `);
  console.log('email_outbox columns:', outboxCols.rows.map(c => c.column_name).join(', '));

  const outboxMessages = await pool.query(`
    SELECT id, campaign_id, lead_id, status, attempt_count, error_message, queued_at, sent_at, created_at 
    FROM email_outbox 
    ORDER BY created_at ASC
  `);
  outboxMessages.rows.forEach(m => {
    console.log(`Outbox: id=${m.id}, campaign_id=${m.campaign_id}, lead=${m.lead_id}, status=${m.status}, attempts=${m.attempt_count}, err=${m.error_message}, queued=${m.queued_at?.toISOString()}`);
  });

  // Suppressions
  const suppCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'email_suppression_list'
    ORDER BY ordinal_position
  `);
  console.log('email_suppression_list columns:', suppCols.rows.map(c => c.column_name).join(', '));

  const suppressions = await pool.query('SELECT reason, COUNT(*) FROM email_suppression_list GROUP BY reason');
  console.log('Suppression breakdown:', suppressions.rows);
  const allSupp = await pool.query('SELECT id, reason, source, suppressed_at FROM email_suppression_list');
  console.log('Suppression entries count:', allSupp.rows.length);
  allSupp.rows.forEach(s => {
    console.log(`Suppression: id=${s.id}, reason=${s.reason}, source=${s.source}, suppressed_at=${s.suppressed_at?.toISOString()}`);
  });

  // Campaigns
  const campCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'email_campaigns'
    ORDER BY ordinal_position
  `);
  console.log('email_campaigns columns:', campCols.rows.map(c => c.column_name).join(', '));

  const campaigns = await pool.query('SELECT * FROM email_campaigns');
  console.log('Campaigns:', campaigns.rows);

  // Cross-reference campaign leads vs outbox
  const outboxLeads = await pool.query(`
    SELECT o.id AS outbox_id, o.status, o.campaign_id, l.id AS lead_id, l.city, l.category, l.suppressed, l.outreach_eligible
    FROM email_outbox o
    JOIN lead_prospects l ON o.lead_id = l.id
  `);
  console.log('Outbox cross-referenced with leads:', outboxLeads.rows);

  await pool.end();
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
