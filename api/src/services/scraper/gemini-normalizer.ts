/**
 * AageOnline API — Gemini AI Normalization Service
 * Milestone 0.20.27: Unified Lead Scraper + Zero-Inspired Email Automation
 *
 * Server-side Gemini API integration for optional AI-assisted extraction and categorization.
 * Invariants:
 * - GEMINI_API_KEY remains server-side only
 * - Gemini never invents emails, phones, or addresses
 * - Never claims an email is verified without evidence
 * - Automatically falls back to deterministic extraction if unconfigured or on error
 */

import https from 'node:https';
import type { ScrapedBusinessCandidate } from './connector-interface.ts';

export interface GeminiNormalizationResult {
  normalizedName: string;
  category: string;
  city: string;
  isCategorizedValid: boolean;
  confidenceScore: number;
  extractedSummary?: string;
  uncertainFlags?: string[];
}

export class GeminiNormalizer {
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Normalizes and classifies candidate business using Gemini API (or deterministic fallback).
   */
  async normalize(candidate: ScrapedBusinessCandidate): Promise<GeminiNormalizationResult> {
    // Fallback if GEMINI_API_KEY is not set or empty
    if (!this.isConfigured()) {
      return this.deterministicNormalize(candidate);
    }

    try {
      const prompt = `
You are a factual business data normalizer for the AageOnline platform.
Given this extracted business profile:
Business Name: ${candidate.businessName}
City: ${candidate.city}
Declared Category: ${candidate.category}
Address: ${candidate.address || 'N/A'}
Website: ${candidate.website || 'N/A'}

Rules:
1. Do NOT invent email addresses, phone numbers, or addresses.
2. Standardize the business name (clean corporate suffixes, proper casing).
3. Classify into the closest valid category (Hospitals, Diagnostic Centres, Interior Designers, Business Consultants, Restaurants, Salons).
4. Return ONLY valid JSON matching this schema:
{
  "normalizedName": "string",
  "category": "string",
  "city": "string",
  "isCategorizedValid": boolean,
  "confidenceScore": number (0.0 to 1.0),
  "extractedSummary": "string",
  "uncertainFlags": ["string"]
}
`;

      const requestBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      });

      const responseText = await this.callGeminiApi(requestBody);
      const parsed = JSON.parse(responseText);

      // Validate parsed response
      if (parsed.normalizedName && parsed.category) {
        return {
          normalizedName: String(parsed.normalizedName).trim(),
          category: String(parsed.category).trim(),
          city: String(parsed.city || candidate.city).trim(),
          isCategorizedValid: Boolean(parsed.isCategorizedValid),
          confidenceScore: Number(parsed.confidenceScore) || 0.9,
          extractedSummary: parsed.extractedSummary ? String(parsed.extractedSummary) : undefined,
          uncertainFlags: Array.isArray(parsed.uncertainFlags) ? parsed.uncertainFlags : [],
        };
      }
      return this.deterministicNormalize(candidate);
    } catch {
      // Graceful fallback to deterministic logic on any API failure
      return this.deterministicNormalize(candidate);
    }
  }

  private deterministicNormalize(candidate: ScrapedBusinessCandidate): GeminiNormalizationResult {
    const cleaned = candidate.businessName
      .replace(/\s+/g, ' ')
      .trim();

    const TAXONOMY_MAP: Record<string, string> = {
      hospital: 'Hospitals',
      hospitals: 'Hospitals',
      diagnostic: 'Diagnostic Centres',
      'diagnostic centre': 'Diagnostic Centres',
      'diagnostic centres': 'Diagnostic Centres',
      interior: 'Interior Designers',
      'interior designer': 'Interior Designers',
      'interior designers': 'Interior Designers',
      restaurant: 'Restaurants',
      restaurants: 'Restaurants',
      consultant: 'Business Consultants',
      consultants: 'Business Consultants',
      salon: 'Salons',
      salons: 'Salons',
    };
    const catLower = candidate.category.toLowerCase().trim();
    const mappedCategory = TAXONOMY_MAP[catLower] || (candidate.category.charAt(0).toUpperCase() + candidate.category.slice(1));
    const cityTitle = candidate.city.charAt(0).toUpperCase() + candidate.city.slice(1).toLowerCase();

    return {
      normalizedName: cleaned,
      category: mappedCategory,
      city: cityTitle,
      isCategorizedValid: true,
      confidenceScore: 1.0,
      extractedSummary: `${cleaned} operates in ${cityTitle} in the ${mappedCategory} market.`,
      uncertainFlags: [],
    };
  }

  private callGeminiApi(payload: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 5000,
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(body);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                return resolve(text);
              }
              reject(new Error('Empty Gemini candidates'));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Gemini API error HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Gemini API timeout'));
      });

      req.on('error', (err) => reject(err));
      req.write(payload);
      req.end();
    });
  }
}

export const geminiNormalizer = new GeminiNormalizer();
