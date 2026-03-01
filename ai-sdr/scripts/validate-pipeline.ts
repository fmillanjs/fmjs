/**
 * End-to-end pipeline validation script.
 * Run: cd ai-sdr && npx ts-node scripts/validate-pipeline.ts
 *
 * Requires: ANTHROPIC_API_KEY in .env, Docker Compose running (Postgres on port 5436).
 * Creates a test Lead in Postgres, runs the full pipeline, and asserts the results.
 * Makes real Claude API calls.
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PipelineService, StepEvent } from '../src/pipeline/pipeline.service';
import { PrismaService } from '../src/database/prisma.service';

async function main() {
  console.log('\n=== VALIDATE PIPELINE ===\n');

  // Bootstrap NestJS application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const pipeline = app.get(PipelineService);
  const prisma = app.get(PrismaService);

  // Create a test lead
  const lead = await prisma.lead.create({
    data: {
      name: 'Sarah Chen',
      companyName: 'Flowmatic',
      companyUrl: 'https://flowmatic.io',
      status: 'pending',
    },
  });
  console.log(`Created lead: ${lead.id}`);

  // Track step events
  const events: string[] = [];
  let tokenCount = 0;

  const onStep = (event: StepEvent) => {
    if (event.type === 'personalize-token') {
      tokenCount++;
      process.stdout.write(event.token);
    } else {
      console.log(`\n[event] ${event.type}`);
      events.push(event.type);
    }
  };

  console.log('\nRunning pipeline...\n');
  await pipeline.processWithStream(lead.id, onStep);
  console.log('\n');

  // Assertions
  const updated = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
  const outputs = await prisma.aIOutput.findMany({ where: { leadId: lead.id } });

  const assert = (condition: boolean, msg: string) => {
    if (!condition) throw new Error(`ASSERTION FAILED: ${msg}`);
    console.log(`  PASS: ${msg}`);
  };

  console.log('\n=== ASSERTIONS ===');
  assert(updated.icpScore !== null, `icpScore is non-null (got: ${updated.icpScore})`);
  assert(
    updated.icpScore! >= 0 && updated.icpScore! <= 100,
    `icpScore in range 0-100 (got: ${updated.icpScore})`,
  );
  assert(updated.status === 'complete', `status is 'complete' (got: ${updated.status})`);
  assert(updated.industry !== null, `industry is non-null (got: ${updated.industry})`);
  assert(updated.companySize !== null, `companySize is non-null (got: ${updated.companySize})`);
  assert(outputs.length === 3, `3 AIOutput rows created (got: ${outputs.length})`);
  assert(outputs.some((o) => o.step === 'qualify'), 'AIOutput with step="qualify" exists');
  assert(outputs.some((o) => o.step === 'enrich'), 'AIOutput with step="enrich" exists');
  assert(outputs.some((o) => o.step === 'personalize'), 'AIOutput with step="personalize" exists');
  assert(events.includes('qualify-complete'), 'qualify-complete event fired');
  assert(events.includes('enrich-complete'), 'enrich-complete event fired');
  assert(events.includes('personalize-complete'), 'personalize-complete event fired');
  assert(tokenCount > 0, `personalize-token events fired (got: ${tokenCount} tokens)`);

  console.log(`\n=== ALL ASSERTIONS PASSED ===`);
  console.log(`icpScore: ${updated.icpScore}`);
  console.log(`industry: ${updated.industry}`);
  console.log(`companySize: ${updated.companySize}`);
  console.log(`tokens received: ${tokenCount}`);

  // Cleanup test lead
  await prisma.lead.delete({ where: { id: lead.id } });
  console.log(`Cleaned up test lead: ${lead.id}`);

  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
