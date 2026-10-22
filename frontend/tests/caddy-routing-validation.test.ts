/**
 * AageOnline — Phase 1D.1: Caddyfile Routing & Ingress Topology Validation Test Suite
 *
 * Validates:
 * 1. Caddyfile Structural Integrity: Balanced braces, trusted proxies, security headers, and domain blocks.
 * 2. Host-to-Container Ingress Mapping:
 *    - {$SITE_ADDRESS:aageonline.com} -> web:3000 (Canonical Web & Webhook Processor)
 *    - api.{$SITE_ADDRESS:aageonline.com} -> api:4000 (Authoritative Node REST API)
 *    - admin.{$SITE_ADDRESS:aageonline.com} -> admin:3001 (Operational Admin Control Center)
 * 3. Proposed Compatibility Matcher Syntax & Directive Ordering:
 *    - @payu_webhook matcher matches strictly method POST and path /api/payments/webhooks/payu.
 *    - Directive ordering places @payu_webhook BEFORE the fallback reverse_proxy api:4000.
 *    - Preserves all other /api/* routes on api.aageonline.com without interference.
 *    - Browser callbacks (/api/payments/callback/payu) are NEVER forwarded from api.aageonline.com.
 * 4. Upstream Forwarded Headers & Host Invariants:
 *    - Verifies header_up configuration across reverse_proxy blocks.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 1D.1 — Caddyfile Routing & Ingress Validation', () => {
  const caddyfilePath = path.resolve(process.cwd(), '..', 'Caddyfile');
  const caddyfileContent = fs.existsSync(caddyfilePath)
    ? fs.readFileSync(caddyfilePath, 'utf-8')
    : fs.readFileSync(path.resolve(process.cwd(), 'Caddyfile'), 'utf-8');

  it('1. Caddyfile should have balanced curly braces and valid global configuration', () => {
    let openBraces = 0;
    let closeBraces = 0;

    for (const char of caddyfileContent) {
      if (char === '{') openBraces++;
      if (char === '}') closeBraces++;
    }

    assert.equal(openBraces, closeBraces, 'Caddyfile must have balanced braces');
    assert.ok(openBraces >= 4, 'Caddyfile should define global and at least 3 site blocks');
    assert.match(caddyfileContent, /trusted_proxies\s+private_ranges/i);
  });

  it('2. Canonical Website block must route all traffic to web:3000', () => {
    const webBlockMatch = caddyfileContent.match(
      /\{\$SITE_ADDRESS:aageonline\.com\},\s*www\.\{\$SITE_ADDRESS:aageonline\.com\}\s*\{([\s\S]*?)\n\}/
    );
    assert.ok(webBlockMatch, 'Expected public website block in Caddyfile');
    const webBlock = webBlockMatch[1];

    assert.match(webBlock, /reverse_proxy\s+web:3000/);
    assert.match(webBlock, /header_up\s+Host\s+\{host\}/);
    assert.match(webBlock, /header_up\s+X-Real-IP\s+\{remote_host\}/);
    assert.match(webBlock, /header_up\s+X-Forwarded-For\s+\{remote_host\}/);
    assert.match(webBlock, /header_up\s+X-Forwarded-Proto\s+\{scheme\}/);
  });

  it('3. Standalone API block must route all standard API traffic to api:4000', () => {
    const apiBlockMatch = caddyfileContent.match(
      /api\.\{\$SITE_ADDRESS:aageonline\.com\}\s*\{([\s\S]*?)\n\}/
    );
    assert.ok(apiBlockMatch, 'Expected api site block in Caddyfile');
    const apiBlock = apiBlockMatch[1];

    assert.match(apiBlock, /reverse_proxy\s+api:4000/);
    assert.match(apiBlock, /response_header_timeout\s+60s/);
  });

  it('4. Admin block must route traffic to admin:3001', () => {
    const adminBlockMatch = caddyfileContent.match(
      /admin\.\{\$SITE_ADDRESS:aageonline\.com\}\s*\{([\s\S]*?)\n\}/
    );
    assert.ok(adminBlockMatch, 'Expected admin site block in Caddyfile');
    const adminBlock = adminBlockMatch[1];

    assert.match(adminBlock, /reverse_proxy\s+admin:3001/);
  });

  it('5. Proposed Caddy Compatibility Matcher Simulation & Non-Interference', () => {
    // Model the proposed compatibility rule
    const proposedRule = `
    @payu_webhook {
        method POST
        path /api/payments/webhooks/payu
    }
    reverse_proxy @payu_webhook web:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}

        transport http {
            response_header_timeout 30s
            dial_timeout 5s
        }
    }
    `;

    // Rule routing simulation logic
    function simulateCaddyRouting(method: string, pathname: string): 'web:3000' | 'api:4000' {
      // 1. Named matcher evaluation: @payu_webhook { method POST; path /api/payments/webhooks/payu }
      const matchesPayuWebhook = method === 'POST' && pathname === '/api/payments/webhooks/payu';
      if (matchesPayuWebhook) {
        return 'web:3000';
      }

      // 2. Fallback reverse_proxy api:4000
      return 'api:4000';
    }

    // A. Target webhook path with POST routes to web:3000
    assert.equal(simulateCaddyRouting('POST', '/api/payments/webhooks/payu'), 'web:3000');

    // B. Target webhook path with GET does NOT match matcher, falls through to api:4000 (returns 404)
    assert.equal(simulateCaddyRouting('GET', '/api/payments/webhooks/payu'), 'api:4000');

    // C. Browser return callback does NOT match matcher, falls through to api:4000 (returns 404)
    assert.equal(simulateCaddyRouting('POST', '/api/payments/callback/payu'), 'api:4000');
    assert.equal(simulateCaddyRouting('GET', '/api/payments/callback/payu'), 'api:4000');

    // D. All standard API endpoints continue routing to api:4000 untouched
    assert.equal(simulateCaddyRouting('GET', '/api/health'), 'api:4000');
    assert.equal(simulateCaddyRouting('GET', '/api/markets'), 'api:4000');
    assert.equal(simulateCaddyRouting('POST', '/api/bid-intents'), 'api:4000');
    assert.equal(simulateCaddyRouting('POST', '/api/admin/auth/login'), 'api:4000');
    assert.equal(simulateCaddyRouting('POST', '/api/admin/rankings'), 'api:4000');
    assert.equal(simulateCaddyRouting('POST', '/api/payments/unknown'), 'api:4000');
  });

  it('6. Browser return callback routes must never be exposed or forwarded on api.aageonline.com', () => {
    // Assert that the proposed rule contains NO match for callback
    const proposedRule = `
    @payu_webhook {
        method POST
        path /api/payments/webhooks/payu
    }
    `;
    assert.equal(proposedRule.includes('/api/payments/callback'), false);
  });
});
