import { Command } from "commander";

const program = new Command();

program
  .name("envault")
  .description("Type-safe config validation toolkit")
  .version("0.0.1");

program
  .command("check")
  .description("Validate current environment configuration")
  .option("-c, --config <path>", "Config file path", "envault.config.ts")
  .option("-e, --env <path>", "Env file path to check")
  .action(() => {
    console.log("TODO: check command");
  });

program
  .command("generate")
  .description("Generate .env.example file")
  .option("-o, --output <path>", "Output file path", ".env.example")
  .action(() => {
    console.log("TODO: generate command");
  });

program
  .command("diff <file1> <file2>")
  .description("Compare two environment files")
  .action(() => {
    console.log("TODO: diff command");
  });

program
  .command("audit")
  .description("Detect potential secrets exposure")
  .action(() => {
    console.log("TODO: audit command");
  });

program.parse();
