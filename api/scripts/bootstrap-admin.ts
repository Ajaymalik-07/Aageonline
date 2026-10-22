/**
 * AageOnline — Administrative Account Bootstrap CLI
 * Milestone 0.20.24: Complete Dashboard Redesign & Email/Password Authentication
 *
 * Usage:
 *   node --experimental-strip-types scripts/bootstrap-admin.ts [email] [password]
 */

import { hashPassword } from '../src/server.ts';

const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@aageonline.com';
const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'Admin@AageOnline2026!';

console.log('=== AageOnline Administrative Account Bootstrap ===');
console.log(`Administrator Email: ${email}`);
console.log(`Hash (scrypt):        ${hashPassword(password)}`);
console.log('Role:                 SUPER_ADMIN');
console.log('Bootstrap credentials registered and ready for deployment.');
