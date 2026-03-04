#!/usr/bin/env node
/**
 * Test Connect command logic: ensureDevFlowModel
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const TEST_DIR = join(homedir(), '.continue-devflow-test');
const TEST_CONFIG = join(TEST_DIR, 'config.json');

// Simulate ensureDevFlowModel
function ensureDevFlowModel(models, port = 8080) {
  const devflow = {
    title: 'DevFlow Router',
    provider: 'openai',
    model: 'gpt-4o',
    apiBase: `http://localhost:${port}/v1`,
    apiKey: 'devflow-local',
  };
  const withoutDevFlow = models.filter((m) => {
    if (typeof m !== 'object' || m === null) return true;
    const obj = m;
    if (obj.title === 'DevFlow Router') return false;
    if (obj.apiBase?.includes('localhost:') && obj.apiBase?.includes('/v1')) return false;
    return true;
  });
  return [devflow, ...withoutDevFlow];
}

function run() {
  mkdirSync(TEST_DIR, { recursive: true });

  // Test 1: Empty config
  const empty = ensureDevFlowModel([]);
  if (empty.length !== 1 || empty[0].title !== 'DevFlow Router') {
    throw new Error('Empty config: expected 1 DevFlow model');
  }

  // Test 2: Config with existing model
  const withExisting = ensureDevFlowModel([{ title: 'GPT-4', provider: 'openai', model: 'gpt-4o' }]);
  if (withExisting.length !== 2 || withExisting[0].title !== 'DevFlow Router') {
    throw new Error('With existing: expected DevFlow first');
  }

  // Test 3: Config with existing DevFlow (should replace)
  const withDevFlow = ensureDevFlowModel([
    { title: 'DevFlow Router', apiBase: 'http://localhost:8080/v1' },
    { title: 'Claude' },
  ]);
  if (withDevFlow.length !== 2 || withDevFlow[0].apiBase !== 'http://localhost:8080/v1') {
    throw new Error('With DevFlow: should have updated entry');
  }

  // Test 4: Write and read real file
  const config = { models: ensureDevFlowModel([]) };
  writeFileSync(TEST_CONFIG, JSON.stringify(config, null, 2));
  const read = JSON.parse(readFileSync(TEST_CONFIG, 'utf-8'));
  if (read.models?.[0]?.title !== 'DevFlow Router') {
    throw new Error('File write/read failed');
  }

  // Cleanup
  rmSync(TEST_DIR, { recursive: true, force: true });

  console.log('✓ Connect logic tests passed');
}

run();
