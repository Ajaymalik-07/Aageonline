/**
 * AageOnline API — Safe Email Template Rendering Engine
 * Milestone 0.20.27: Unified Lead Scraper + Zero-Inspired Email Automation
 *
 * Invariants:
 * - Escapes scraped/user-controlled strings to prevent HTML/XSS injection
 * - Replaces variables: {{businessName}}, {{category}}, {{city}}, {{registrationUrl}}, {{contactName}}
 * - Mandates clear opt-out disclosure and instant unsubscribe URL
 */

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface TemplateVariables {
  businessName: string;
  category: string;
  city: string;
  contactName?: string;
  registrationUrl?: string;
  optOutUrl?: string;
  [key: string]: string | undefined;
}

export function renderEmailTemplate(
  bodyTemplate: string,
  variables: TemplateVariables,
  isHtml = true
): string {
  let rendered = bodyTemplate;

  const safeVars: Record<string, string> = {
    businessName: isHtml ? escapeHtml(variables.businessName) : variables.businessName,
    category: isHtml ? escapeHtml(variables.category) : variables.category,
    city: isHtml ? escapeHtml(variables.city) : variables.city,
    contactName: isHtml ? escapeHtml(variables.contactName || 'Business Owner') : (variables.contactName || 'Business Owner'),
    registrationUrl: variables.registrationUrl || 'https://aageonline.com/business/claim',
    optOutUrl: variables.optOutUrl || `https://aageonline.com/api/public/leads/opt-out?email=${encodeURIComponent(variables.businessName)}`,
  };

  // Replace standard {{var}} placeholders
  for (const [key, val] of Object.entries(safeVars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, val);
  }

  // Mandatory opt-out footer injection if not already present
  if (isHtml && !rendered.includes('unsubscribe')) {
    rendered += `
<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5; font-family: sans-serif;">
  <p style="margin: 0 0 6px 0;">
    You received this commercial invitation from <strong>AageOnline</strong> because <em>${safeVars.businessName}</em> is publicly listed in ${safeVars.city}.
  </p>
  <p style="margin: 0;">
    To stop receiving competitive positioning invitations, <a href="${safeVars.optOutUrl}" style="color: #ea580c; text-decoration: underline;">click here to unsubscribe instantly</a>.
  </p>
</div>`;
  }

  return rendered;
}
