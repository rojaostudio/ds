#!/usr/bin/env node
/**
 * cli.ts — the `rojao-ds-codemod` bin. The command is ./run.ts; this file only hands it the arguments and sets the
 * exit code. `process.exitCode`, not `process.exit()`: exiting right after a log can cut the output of a pipe.
 */
import { main } from './run';

process.exitCode = main(process.argv.slice(2));
