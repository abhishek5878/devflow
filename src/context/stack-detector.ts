/**
 * DevFlow AI - Stack Detection
 * Deterministic file parsing to infer project tech stack
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface StackInfo {
  primary: string;
  language: string;
  runtime: string;
  frameworks: string[];
  database: string | null;
}

const FRAMEWORK_DEPS: Record<string, string> = {
  next: 'Next.js',
  'next.js': 'Next.js',
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  '@sveltejs/kit': 'SvelteKit',
  express: 'Express',
  fastify: 'Fastify',
  nestjs: 'NestJS',
  '@nestjs/core': 'NestJS',
  tailwind: 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
};

const DB_DEPS: Record<string, string> = {
  '@supabase/supabase-js': 'Supabase',
  supabase: 'Supabase',
  'pg': 'PostgreSQL',
  'pg-native': 'PostgreSQL',
  mysql: 'MySQL',
  mysql2: 'MySQL',
  mongodb: 'MongoDB',
  mongoose: 'MongoDB',
  prisma: 'Prisma',
  '@prisma/client': 'Prisma',
  drizzle: 'Drizzle',
  'drizzle-orm': 'Drizzle',
  knex: 'Knex',
  sequelize: 'Sequelize',
};

const INTEGRATION_DEPS: Record<string, string> = {
  stripe: 'Stripe',
  '@stripe/stripe-js': 'Stripe',
  firebase: 'Firebase',
  'firebase-admin': 'Firebase',
};

function readJsonSafe<T>(path: string): T | null {
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Detect project stack from dependency and config files.
 */
export async function detectStack(projectPath: string): Promise<StackInfo> {
  const result: StackInfo = {
    primary: 'Unknown',
    language: 'Unknown',
    runtime: 'Unknown',
    frameworks: [],
    database: null,
  };

  // Node.js ecosystem (package.json)
  const pkgPath = join(projectPath, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = readJsonSafe<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      engines?: { node?: string };
    }>(pkgPath);
    if (pkg) {
      result.runtime = pkg.engines?.node
        ? `Node.js ${pkg.engines.node}`
        : 'Node.js';
      result.language = pkg.dependencies?.['typescript'] || pkg.devDependencies?.['typescript']
        ? 'TypeScript'
        : 'JavaScript';

      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      const depNames = Object.keys(allDeps).map((k) => k.toLowerCase());

      for (const dep of depNames) {
        const fw = FRAMEWORK_DEPS[dep];
        if (fw && !result.frameworks.includes(fw)) result.frameworks.push(fw);
        const db = DB_DEPS[dep];
        if (db) result.database = db;
      }
      for (const dep of depNames) {
        const ig = INTEGRATION_DEPS[dep];
        if (ig && !result.frameworks.includes(ig)) result.frameworks.push(ig);
      }

      if (result.frameworks.includes('Next.js')) {
        const next = pkg.dependencies?.['next'] || pkg.devDependencies?.['next'];
        result.primary = next
          ? `Next.js ${next.replace(/[\^~]/, '').split('.')[0]}`
          : 'Next.js';
      } else if (result.frameworks.includes('NestJS')) {
        result.primary = 'NestJS';
      } else if (result.frameworks.includes('SvelteKit')) {
        result.primary = 'SvelteKit';
      } else if (result.frameworks.includes('React')) {
        result.primary = 'React';
      } else if (result.frameworks.includes('Express')) {
        result.primary = 'Express';
      } else if (result.frameworks.length > 0) {
        result.primary = result.frameworks[0];
      } else {
        result.primary = result.language;
      }
      return result;
    }
  }

  // Go
  if (existsSync(join(projectPath, 'go.mod'))) {
    result.primary = 'Go';
    result.language = 'Go';
    result.runtime = 'Go';
    return result;
  }

  // Rust
  if (existsSync(join(projectPath, 'Cargo.toml'))) {
    result.primary = 'Rust';
    result.language = 'Rust';
    result.runtime = 'Rust';
    return result;
  }

  // Python
  if (
    existsSync(join(projectPath, 'requirements.txt')) ||
    existsSync(join(projectPath, 'pyproject.toml'))
  ) {
    result.primary = 'Python';
    result.language = 'Python';
    result.runtime = 'Python';
    return result;
  }

  // Ruby
  if (existsSync(join(projectPath, 'Gemfile'))) {
    result.primary = 'Ruby';
    result.language = 'Ruby';
    result.runtime = 'Ruby';
    return result;
  }

  return result;
}
