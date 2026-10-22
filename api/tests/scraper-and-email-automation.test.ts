/**
 * AageOnline API — Milestone 0.20.27 Test Suite
 * Unified Lead Scraper + Zero-Inspired Email Automation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { server } from '../src/server.ts';
import {
  GoogleMapsConnector,
  convertIndicNumbers,
  cleanGoogleMapsText,
} from '../src/services/scraper/google-maps-connector.ts';
import {
  WebsiteCrawlerConnector,
  isSafeUrl,
  extractEmailsFromHtml,
  extractPhonesFromHtml,
} from '../src/services/scraper/website-crawler-connector.ts';
import {
  CsvImportConnector,
  parseCsvContent,
  sanitizeCsvCell,
} from '../src/services/scraper/csv-connector.ts';
import {
  GoogleSearchConnector,
  MetaSocialConnector,
  LinkedInConnector,
  XSocialConnector,
} from '../src/services/scraper/social-connectors.ts';
import { geminiNormalizer } from '../src/services/scraper/gemini-normalizer.ts';
import { renderEmailTemplate, escapeHtml } from '../src/services/email/template-renderer.ts';
import { scraperRepository } from '../src/db/repositories/scraper-repo.ts';
import { emailAutomationRepository } from '../src/db/repositories/email-automation-repo.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function withTestServer(fn: (baseUrl: string) => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    const testServer = http.createServer((req, res) => {
      server.emit('request', req, res);
    });

    testServer.listen(0, '127.0.0.1', async () => {
      const address = testServer.address() as { port: number };
      const baseUrl = `http://127.0.0.1:${address.port}`;
      try {
        await fn(baseUrl);
        testServer.closeAllConnections?.();
        testServer.close(() => resolve());
      } catch (err) {
        testServer.closeAllConnections?.();
        testServer.close(() => reject(err));
      }
    });
  });
}

test('Milestone 0.20.27: Unified Lead Scraper & Zero Email Automation Suite', async (t) => {
  await t.test('1. Migration 013: Schema and Entity Definition Verification', async () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../frontend/lib/db/migrations/013_lead_scraper_and_email_automation.sql'
    );
    assert.ok(fs.existsSync(migrationPath), 'Migration 013 must exist on disk');

    const sql = fs.readFileSync(migrationPath, 'utf8');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS scraper_configs'), 'Must create scraper_configs table');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS scraper_jobs'), 'Must create scraper_jobs table');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS email_templates'), 'Must create email_templates table');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS email_campaigns'), 'Must create email_campaigns table');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS email_outbox'), 'Must create email_outbox table');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS email_suppression_list'), 'Must create email_suppression_list table');
    assert.ok(sql.includes('ALTER TABLE lead_prospects'), 'Must enrich lead_prospects schema');
    assert.ok(sql.includes('normalized_name'), 'Must include normalized_name in lead_prospects');
    assert.ok(sql.includes('outreach_eligible'), 'Must include outreach_eligible column');
    assert.ok(sql.includes('suppressed'), 'Must include suppressed column');
  });

  await t.test('2. Google Maps Connector: Glyph Stripping & Bengali/Indic Numeral Normalization', async () => {
    const maps = new GoogleMapsConnector();
    assert.equal(maps.id, 'google_maps');
    assert.equal(maps.operationalStatus, 'OPERATIONAL');

    // Test cleaning functions adapted from Social-Media-AutoPilot-Engine
    const rawName = '\ue0c8 City Care Hospital \ue702';
    const rawAddress = '\ue0c8 Model Town, Hisar \ue0b0';
    const rawPhone = '+৯১ ৯৮১২৩ ৪৫৬৭৮'; // Bengali numerals +91 98123 45678

    const cleanedName = cleanGoogleMapsText(rawName);
    const cleanedAddress = cleanGoogleMapsText(rawAddress);
    const normalizedPhone = convertIndicNumbers(rawPhone);

    assert.equal(cleanedName, 'City Care Hospital');
    assert.equal(cleanedAddress, 'Model Town, Hisar');
    assert.equal(normalizedPhone, '+91 98123 45678', 'Bengali numerals must normalize to standard ASCII digits');
  });

  await t.test('3. Google Maps Connector: Discovery Targeting & Multi-Category Extraction', async () => {
    const maps = new GoogleMapsConnector();
    const hisarResults = await maps.discover({
      location: 'Hisar',
      category: 'Hospitals',
      limit: 10,
    });
    const noidaResults = await maps.discover({
      location: 'Noida',
      category: 'Interior Designers',
      limit: 10,
    });

    assert.ok(hisarResults.length > 0, 'Must discover candidates from Hisar Hospitals');
    assert.ok(noidaResults.length > 0, 'Must discover candidates from Noida Interior Designers');
    assert.equal(hisarResults[0].city, 'Hisar');
    assert.equal(hisarResults[0].category, 'Hospitals');
    assert.equal(noidaResults[0].city, 'Noida');
    assert.equal(noidaResults[0].category, 'Interior Designers');
  });

  await t.test('4. Website Crawler: SSRF Protection & Safe HTML Extraction', async () => {
    // Verify SSRF rejection
    assert.equal(isSafeUrl('http://127.0.0.1:8080/admin'), false, 'Must block loopback 127.0.0.1');
    assert.equal(isSafeUrl('http://169.254.169.254/latest/meta-data'), false, 'Must block AWS IMDS 169.254.169.254');
    assert.equal(isSafeUrl('http://192.168.1.1/router'), false, 'Must block RFC1918 private IP 192.168.1.1');
    assert.equal(isSafeUrl('http://localhost:3000/internal'), false, 'Must block localhost');
    assert.equal(isSafeUrl('https://citycarehospital.example.com'), true, 'Must permit valid external public URL');

    // Verify HTML contact extraction
    const mockHtml = `
      <html>
        <head><title>Apex Dental Clinic - Contact</title></head>
        <body>
          <h1>Get In Touch with Apex Dental Clinic</h1>
          <p>Email our front desk at contact@apexdental.example.com or info@apexdental.example.com</p>
          <p>Call us at +91 9876543210</p>
        </body>
      </html>
    `;

    const extractedEmails = extractEmailsFromHtml(mockHtml);
    const extractedPhones = extractPhonesFromHtml(mockHtml);

    assert.ok(extractedEmails.includes('contact@apexdental.example.com'));
    assert.ok(extractedPhones.some((p) => p.includes('9876543210')));
  });

  await t.test('5. CSV Connector: Formula Injection Protection & Strict Column Normalization', async () => {
    // Formula injection tests
    assert.equal(sanitizeCsvCell('=cmd|/C calc'), "'=cmd|/C calc", 'Must prefix = with single quote');
    assert.equal(sanitizeCsvCell('@SUM(1+1)'), "'@SUM(1+1)", 'Must prefix @ with single quote');
    assert.equal(sanitizeCsvCell('+123'), "'+123", 'Must prefix + with single quote');
    assert.equal(sanitizeCsvCell('Normal Clinic'), 'Normal Clinic', 'Must not touch normal cells');

    const maliciousCsv = `businessName,city,category,contactEmail,contactPhone,website
=cmd|' /C calc'!A0,Hisar,Hospitals,bad1@example.com,+919999999999,https://bad1.example.com
@SUM(1+1),Hisar,Diagnostic Centres,bad2@example.com,+919999999998,https://bad2.example.com
Normal Clinic,Hisar,Hospitals,normal@example.com,+919999999997,https://normal.example.com`;

    const parsed = parseCsvContent(maliciousCsv);
    assert.equal(parsed.length, 3);
    assert.ok(!parsed[0].businessName.startsWith('='), 'Must neutralize spreadsheet formula injection prefix =');
    assert.ok(!parsed[1].businessName.startsWith('@'), 'Must neutralize spreadsheet formula injection prefix @');
    assert.equal(parsed[2].businessName, 'Normal Clinic');
  });

  await t.test('6. Social & Search Connectors: Truthful Status & Permission Boundaries', async () => {
    const gSearch = new GoogleSearchConnector();
    const meta = new MetaSocialConnector();
    const linkedin = new LinkedInConnector();
    const twitter = new XSocialConnector();

    assert.equal(gSearch.operationalStatus, 'OPERATIONAL');
    assert.equal(meta.operationalStatus, 'CONFIG_REQUIRED');
    assert.equal(linkedin.operationalStatus, 'CONFIG_REQUIRED');
    assert.equal(twitter.operationalStatus, 'CONFIG_REQUIRED');

    // Never pretend to scrape when unconfigured
    const metaRes = await meta.discover({ location: 'Hisar', category: 'Hospitals', limit: 5 });
    const linkedinRes = await linkedin.discover({ location: 'Hisar', category: 'Hospitals', limit: 5 });
    const xRes = await twitter.discover({ location: 'Hisar', category: 'Hospitals', limit: 5 });

    assert.deepEqual(metaRes, [], 'Unconfigured Meta connector must return empty candidate list');
    assert.deepEqual(linkedinRes, [], 'Unconfigured LinkedIn connector must return empty candidate list');
    assert.deepEqual(xRes, [], 'Unconfigured X connector must return empty candidate list');
  });

  await t.test('7. Gemini Normalizer: Deterministic Fallback & Classification Invariants', async () => {
    // Without GEMINI_API_KEY, should safely fall back to deterministic extraction
    const rawCandidate = {
      businessName: 'Dr. Bansal Modern Diagnostic & Scan Lab Pvt Ltd',
      category: 'diagnostic',
      city: 'hisar',
      address: 'Near Old Bus Stand, Hisar 125001',
      contactPhone: '+91 1662 234567',
      contactEmail: 'bansal.scan@example.com',
      website: 'https://bansalscan.example.com',
      source: 'google_maps',
      sourceUrl: 'https://maps.google.com/bansal',
    };

    const normalized = await geminiNormalizer.normalize(rawCandidate);
    assert.ok(normalized.normalizedName.length > 0);
    assert.equal(normalized.category, 'Diagnostic Centres', 'Must classify to AageOnline taxonomy');
    assert.equal(normalized.city, 'Hisar', 'Must normalize city casing to title case');
  });

  await t.test('8. Email Template Renderer: Variable Interpolation, Escaping & Opt-Out Invariant', async () => {
    const rawTemplate = '<p>Hello {{businessName}}, claim your {{category}} listing in {{city}} at <a href="{{registrationUrl}}">here</a></p>';

    const rendered = renderEmailTemplate(rawTemplate, {
      businessName: '<Script>Alert(1)</script> Sharma Interiors',
      category: 'Interior Designers',
      city: 'Noida',
      registrationUrl: 'https://aageonline.com/business/claim?ref=123',
      optOutUrl: 'https://aageonline.com/api/public/leads/opt-out?email=sharma%40example.com',
    }, true);

    assert.ok(!rendered.includes('<Script>'), 'Untrusted variables must be HTML-escaped to prevent XSS');
    assert.ok(rendered.includes('&lt;Script&gt;Alert(1)&lt;/script&gt; Sharma Interiors'));
    assert.ok(rendered.includes('https://aageonline.com/api/public/leads/opt-out'), 'Must contain authoritative opt-out URL');
    assert.ok(rendered.includes('click here to unsubscribe instantly'), 'Must append compliant unsubscribe footer');
  });

  await t.test('9. Authoritative Deduplication & Lead Persistence Layer', async () => {
    const uniqueSuffix = Date.now().toString(36);
    const testEmail = `contact_${uniqueSuffix}@lifelinehisar.example.com`;
    const res1 = await scraperRepository.upsertLead({
      businessName: `LifeLine Hospital ${uniqueSuffix}`,
      category: 'Hospitals',
      city: 'Hisar',
      contactEmail: testEmail,
      contactPhone: '+91 98123 00001',
      website: 'https://lifelinehisar.example.com',
      source: 'google_maps',
      sourceUrl: 'https://maps.google.com/lifeline',
      provenance: { source: 'google_maps', discoveredAt: new Date().toISOString() },
    });

    assert.ok(res1.lead.id, 'Lead must have a stable ID');
    assert.equal(res1.isNew, true, 'First insertion must be marked new');

    // Duplicate insertion with same email
    const res2 = await scraperRepository.upsertLead({
      businessName: `LifeLine Hospital Trauma Care ${uniqueSuffix}`,
      category: 'Hospitals',
      city: 'Hisar',
      contactEmail: testEmail,
      contactPhone: '+91 98123 00001',
      source: 'website_crawler',
    });

    assert.equal(res2.lead.id, res1.lead.id, 'Second insertion must deduplicate against res1 lead ID');
    assert.equal(res2.isNew, false, 'Second insertion must NOT be marked new');
    assert.equal(res2.isDuplicate, true, 'Second insertion must be flagged as duplicate');

    const metrics = await scraperRepository.getMetrics();
    assert.ok(metrics.totalDiscovered >= 1);
  });

  await t.test('10. Suppression List Invariant & Public Opt-Out Route', async () => {
    await withTestServer(async (baseUrl) => {
      const testEmail = `optout.test.${Date.now()}@business-haryana.example.com`;

      // 1. Initial check: email is not suppressed
      let isSuppressed = await emailAutomationRepository.isEmailSuppressed(testEmail);
      assert.equal(isSuppressed, false);

      // 2. Perform public opt-out via POST
      const res = await fetch(`${baseUrl}/api/public/leads/opt-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, reason: 'USER_UNSUBSCRIBE' }),
      });

      const data = await res.json();
      if (res.status !== 200) {
        console.error('DEBUG test 10 status and data:', res.status, data);
      }
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.email, testEmail);

      // 3. Email must now be suppressed in PostgreSQL registry
      isSuppressed = await emailAutomationRepository.isEmailSuppressed(testEmail);
      assert.equal(isSuppressed, true, 'Opted out email must be permanently marked suppressed');

      // 4. GET endpoint confirmation page
      const resGet = await fetch(`${baseUrl}/api/public/leads/opt-out?email=${encodeURIComponent(testEmail)}`);
      assert.equal(resGet.status, 200);
      const text = await resGet.text();
      assert.ok(text.includes('Unsubscribe Confirmed'), 'GET confirmation response must display unsubscription confirmation');
    });
  });

  await t.test('11. Admin Endpoints Authentication & RBAC Gates', async () => {
    await withTestServer(async (baseUrl) => {
      // Unauthenticated access to scraper config must be 401
      const resScraper = await fetch(`${baseUrl}/api/admin/scraper/config`);
      assert.equal(resScraper.status, 401, 'Unauthenticated scraper access must return 401');

      // Unauthenticated access to email automation overview must be 401
      const resEmail = await fetch(`${baseUrl}/api/admin/email-automation/overview`);
      assert.equal(resEmail.status, 401, 'Unauthenticated email automation access must return 401');

      // Authenticated with valid dev admin bearer token
      const resScraperAuth = await fetch(`${baseUrl}/api/admin/scraper/connectors`, {
        headers: { Authorization: 'Bearer dev-admin-secret-token' },
      });
      assert.equal(resScraperAuth.status, 200, 'Authenticated admin token must access scraper connectors');
      const dataScraper = await resScraperAuth.json();
      assert.ok(Array.isArray(dataScraper.connectors), 'Must return array of connectors');

      const resEmailAuth = await fetch(`${baseUrl}/api/admin/email-automation/overview`, {
        headers: { Authorization: 'Bearer dev-admin-secret-token' },
      });
      assert.equal(resEmailAuth.status, 200, 'Authenticated admin token must access email automation overview');
      const dataEmail = await resEmailAuth.json();
      if (!dataEmail?.metrics) {
        console.error('DEBUG test 11 resEmailAuth:', resEmailAuth.status, dataEmail);
      }
      assert.ok(dataEmail.metrics, 'Must return email automation metrics');
    });
  });
});
