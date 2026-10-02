// Loads .rojao/detect.json (if present) merged over defaults.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { DetectConfig } from './types';

export const DEFAULT_CONFIG: DetectConfig = {
  include: ['components'],
  ignoreFiles: ['*.figma.tsx', '*.test.tsx', '*.test.ts', '*.stories.tsx'],
  ignoreRules: [],
  ignoreValues: [],
  brand: null,
  failOn: 'error',
};

export function loadConfig(root: string, customPath?: string): DetectConfig {
  const path = customPath ? resolve(root, customPath) : join(root, '.rojao', 'detect.json');
  let fileCfg: Partial<DetectConfig> = {};
  try {
    fileCfg = JSON.parse(readFileSync(path, 'utf8')) as Partial<DetectConfig>;
  } catch {
    // No config file → defaults only.
  }
  return {
    include: fileCfg.include ?? DEFAULT_CONFIG.include,
    ignoreFiles: fileCfg.ignoreFiles ?? DEFAULT_CONFIG.ignoreFiles,
    ignoreRules: fileCfg.ignoreRules ?? DEFAULT_CONFIG.ignoreRules,
    ignoreValues: fileCfg.ignoreValues ?? DEFAULT_CONFIG.ignoreValues,
    brand: fileCfg.brand ?? DEFAULT_CONFIG.brand,
    failOn: fileCfg.failOn ?? DEFAULT_CONFIG.failOn,
  };
}
