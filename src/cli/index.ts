#!/usr/bin/env node
import { Command } from "commander";
import { runCheck } from "./check";
import { runGenerate } from "./generate";
import { runDiff } from "./diff";
import { runAudit } from "./audit";

const program = new Command();

program
  .name("envault")
  .description("Type-safe config validation toolkit")
  .version("0.0.1");

program
  .command("check")
  .description("Validate current environment configuration")
  .option("-c, --config <path>", "Config file path", "envault.config.js")
  .option("-e, --env <path>", "Env file path to check")
  .action((opts: { config: string; env?: string }) => {
    runCheck(opts.config, opts.env);
  });

program
  .command("generate")
  .description("Generate .env.example file")
  .option("-c, --config <path>", "Config file path", "envault.config.js")
  .option("-o, --output <path>", "Output file path", ".env.example")
  .action((opts: { config: string; output: string }) => {
    runGenerate(opts.config, opts.output);
  });

program
  .command("diff <file1> <file2>")
  .description("Compare two environment files")
  .action((file1: string, file2: string) => {
    runDiff(file1, file2);
  });

program
  .command("audit [files...]")
  .description("Detect potential secrets in env files")
  .action((files: string[]) => {
    runAudit(files);
  });

program.parse();
