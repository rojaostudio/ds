// Rule registry. Order here is the reporting order within a line.
import type { Rule } from '../types';
import { themeAwareRules } from './theme-aware';
import { aiSlopRules } from './ai-slop';
import { cssRules } from './css';

export const RULES: Rule[] = [...themeAwareRules, ...aiSlopRules, ...cssRules];

export const RULE_IDS = RULES.map((r) => r.id);
