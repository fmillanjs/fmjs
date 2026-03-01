/**
 * Standalone Claude API validation script.
 * Run: cd ai-sdr && npx ts-node scripts/validate-claude.ts
 *
 * Requires ANTHROPIC_API_KEY in the environment (reads from .env via dotenv).
 * Makes real API calls — confirms structuredOutput and streamText work end-to-end.
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { ClaudeService } from '../src/claude/claude.service';
import { QualifySchema } from '../src/claude/schemas/qualify.schema';
import { EnrichSchema } from '../src/claude/schemas/enrich.schema';
import { QUALIFY_SYSTEM_PROMPT } from '../src/claude/prompts/qualify.prompt';
import { ENRICH_SYSTEM_PROMPT } from '../src/claude/prompts/enrich.prompt';
import { PERSONALIZE_SYSTEM_PROMPT } from '../src/claude/prompts/personalize.prompt';

// Minimal ConfigService stub — reads ANTHROPIC_API_KEY from process.env
const configStub = {
  get: (key: string) => process.env[key],
} as any;

const TEST_LEAD_PROFILE = `
Name: Sarah Chen
Title: CEO
Company: Flowmatic
Employees: 45
Industry: B2B SaaS — workflow automation for operations teams
Profile: Sarah mentioned they struggle to build a consistent outbound pipeline. Currently rely on inbound only. Team uses Notion, Linear, and Slack. Looking to grow from 45 to 100 employees in 12 months.
`;

async function main() {
  const service = new ClaudeService(configStub);

  // --- Test 1: structuredOutput with QualifySchema ---
  console.log('\n=== TEST 1: qualify (run 1) ===');
  const qualify1 = await service.structuredOutput(
    QualifySchema,
    QUALIFY_SYSTEM_PROMPT,
    TEST_LEAD_PROFILE,
  );
  console.log('icpScore:', qualify1.icpScore);
  console.log('reasoning:', qualify1.reasoning);
  console.log('matchedCriteria:', qualify1.matchedCriteria);
  console.log('weakCriteria:', qualify1.weakCriteria);

  // --- Test 2: Temperature 0 determinism (run 2 for same input) ---
  console.log('\n=== TEST 2: qualify (run 2 — determinism check) ===');
  const qualify2 = await service.structuredOutput(
    QualifySchema,
    QUALIFY_SYSTEM_PROMPT,
    TEST_LEAD_PROFILE,
  );
  console.log('icpScore:', qualify2.icpScore);
  const scoreDelta = Math.abs(qualify1.icpScore - qualify2.icpScore);
  console.log(`Score delta between run 1 and run 2: ${scoreDelta}`);
  if (scoreDelta > 5) {
    console.warn(`WARNING: Score variance ${scoreDelta} exceeds ±5 threshold — prompt needs tightening`);
  } else {
    console.log('PASS: Score variance within ±5 tolerance');
  }

  // --- Test 3: structuredOutput with EnrichSchema ---
  console.log('\n=== TEST 3: enrich ===');
  const enrich = await service.structuredOutput(
    EnrichSchema,
    ENRICH_SYSTEM_PROMPT,
    TEST_LEAD_PROFILE,
  );
  console.log('companySize:', enrich.companySize);
  console.log('industry:', enrich.industry);
  console.log('techStack:', enrich.techStack);
  console.log('painPoints:', enrich.painPoints);

  // --- Test 4: streamText for personalization ---
  console.log('\n=== TEST 4: streamText (personalization) ===');
  const personalizationInput = `Lead profile:\n${TEST_LEAD_PROFILE}\n\nEnrichment:\nIndustry: ${enrich.industry}\nTech stack: ${enrich.techStack.join(', ')}\nPain points: ${enrich.painPoints.join(', ')}`;
  let tokenCount = 0;
  process.stdout.write('Email: ');
  for await (const token of service.streamText(PERSONALIZE_SYSTEM_PROMPT, personalizationInput)) {
    process.stdout.write(token);
    tokenCount++;
  }
  console.log(`\n\nToken count: ${tokenCount}`);
  if (tokenCount === 0) {
    console.error('ERROR: streamText yielded no tokens');
    process.exit(1);
  }

  console.log('\n=== ALL TESTS PASSED ===');
}

main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
