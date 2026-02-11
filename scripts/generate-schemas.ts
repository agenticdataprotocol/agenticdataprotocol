#!/usr/bin/env tsx

import { exec } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

// Schema versions to generate
const SCHEMA_VERSIONS = ["2026-01-20"];

// Check if we're in check mode (validate existing schemas match generated ones)
const CHECK_MODE = process.argv.includes("--check");

/**
 * Apply JSON Schema 2020-12 transformations to a schema file.
 *
 * - Updates $schema and definitions → $defs
 * - Upgrades draft-07 tuple syntax (`items` array + `additionalItems`)
 *   to draft 2020-12 keywords (`prefixItems` + `items`)
 */
function applyJsonSchema202012Transformations(schemaPath: string): void {
  let content = readFileSync(schemaPath, "utf-8");

  // Replace $schema URL
  content = content.replace(
    /http:\/\/json-schema\.org\/draft-07\/schema#/g,
    "https://json-schema.org/draft/2020-12/schema",
  );

  // Replace "definitions": with "$defs":
  content = content.replace(/"definitions":/g, '"$defs":');

  // Replace #/definitions/ with #/$defs/
  content = content.replace(/#\/definitions\//g, "#/$defs/");

  const schema = JSON.parse(content);
  fixDraft07TupleKeywords(schema);

  writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + "\n", "utf-8");
}

/**
 * Upgrade draft-07 tuple representation (items: [...], additionalItems)
 * to draft 2020-12 keywords (prefixItems + items).
 */
function fixDraft07TupleKeywords(node: unknown): void {
  if (!node || typeof node !== "object") {
    return;
  }

  const obj = node as Record<string, unknown>;

  if (Array.isArray((obj as any).items) && Object.prototype.hasOwnProperty.call(obj, "additionalItems")) {
    const itemsArray = (obj as any).items as unknown[];
    const additional = (obj as any).additionalItems;

    // First element(s) of the tuple
    (obj as any).prefixItems = itemsArray;

    // Schema for the rest of the items
    if (additional === false) {
      (obj as any).items = false;
    } else if (additional && typeof additional === "object") {
      (obj as any).items = additional;
    } else {
      delete (obj as any).items;
    }

    delete (obj as any).additionalItems;
  }

  for (const value of Object.values(obj)) {
    fixDraft07TupleKeywords(value);
  }
}

/**
 * Generate JSON schema for a specific type from a TypeScript file
 */
async function generateTypeSchema(
  tsFile: string,
  typeName: string,
  outputPath: string,
  check: boolean = false,
): Promise<boolean> {
  if (check) {
    // Read existing schema
    const existingSchema = readFileSync(outputPath, "utf-8");

    // Generate schema to stdout and capture it
    try {
      const { stdout: generated } = await execAsync(
        `npx typescript-json-schema --defaultNumberType integer --required --skipLibCheck --strictNullChecks "${tsFile}" "${typeName}"`,
      );

      let expectedSchema = generated;

      // Apply string-based transformations
      expectedSchema = expectedSchema.replace(
        /http:\/\/json-schema\.org\/draft-07\/schema#/g,
        "https://json-schema.org/draft/2020-12/schema",
      );
      expectedSchema = expectedSchema.replace(/"definitions":/g, '"$defs":');
      expectedSchema = expectedSchema.replace(/#\/definitions\//g, "#/$defs/");
      const parsed = JSON.parse(expectedSchema);
      fixDraft07TupleKeywords(parsed);
      expectedSchema = JSON.stringify(parsed, null, 2) + "\n";

      // Compare
      if (existingSchema.trim() !== expectedSchema.trim()) {
        console.error(`  ✗ Schema for ${typeName} is out of date!`);
        return false;
      }

      console.log(`  ✓ Schema for ${typeName} is up to date`);
      return true;
    } catch (error) {
      console.error(`Failed to check schema for ${typeName}`);
      throw error;
    }
  } else {
    // Run typescript-json-schema
    try {
      await execAsync(
        `npx typescript-json-schema --defaultNumberType integer --required --skipLibCheck --strictNullChecks "${tsFile}" "${typeName}" -o "${outputPath}"`,
      );
    } catch (error) {
      console.error(`Failed to generate schema for ${typeName}`);
      throw error;
    }

    // Apply transformations (2020-12 rewrite, tuple fix, spec constraints)
    applyJsonSchema202012Transformations(outputPath);

    console.log(`  ✓ Generated schema for ${typeName}`);
    return true;
  }
}

/**
 * Generate JSON schema for a specific version
 */
async function generateSchema(
  version: string,
  check: boolean = false,
): Promise<boolean> {
  const schemaDir = join("schema", version);
  const schemaTs = join(schemaDir, "schema.ts");
  const schemaJson = join(schemaDir, "schema.json");

  if (check) {
    // Read existing schema
    const existingSchema = readFileSync(schemaJson, "utf-8");

    // Generate schema to stdout and capture it
    try {
      const { stdout: generated } = await execAsync(
        `npx typescript-json-schema --defaultNumberType integer --required --skipLibCheck --strictNullChecks "${schemaTs}" "*"`,
      );

      let expectedSchema = generated;

      // Apply string-based transformations
      expectedSchema = expectedSchema.replace(
        /http:\/\/json-schema\.org\/draft-07\/schema#/g,
        "https://json-schema.org/draft/2020-12/schema",
      );
      expectedSchema = expectedSchema.replace(/"definitions":/g, '"$defs":');
      expectedSchema = expectedSchema.replace(/#\/definitions\//g, "#/$defs/");
      const parsed = JSON.parse(expectedSchema);
      fixDraft07TupleKeywords(parsed);
      expectedSchema = JSON.stringify(parsed, null, 2) + "\n";

      // Compare
      if (existingSchema.trim() !== expectedSchema.trim()) {
        console.error(`  ✗ Schema ${version} is out of date!`);
        return false;
      }

      console.log(`  ✓ Schema ${version} is up to date`);
      return true;
    } catch (error) {
      console.error(`Failed to check schema for ${version}`);
      throw error;
    }
  } else {
    // Run typescript-json-schema
    try {
      await execAsync(
        `npx typescript-json-schema --defaultNumberType integer --required --skipLibCheck --strictNullChecks "${schemaTs}" "*" -o "${schemaJson}"`,
      );
    } catch (error) {
      console.error(`Failed to generate schema for ${version}`);
      throw error;
    }

    // Apply transformations
    applyJsonSchema202012Transformations(schemaJson);

    console.log(`  ✓ Generated schema for ${version}`);
    return true;
  }
}

/**
 * Generate JSON schemas for curation manifests
 */
async function generateCurationSchemas(
  version: string,
  check: boolean = false,
): Promise<boolean> {
  const schemaDir = join("schema", version);
  const curationTs = join(schemaDir, "curation.ts");

  const manifestTypes = [
    "PhysicalManifest",
    "SemanticManifest",
    "PolicyManifest",
  ];

  const results = await Promise.all(
    manifestTypes.map(async (typeName) => {
      const outputPath = join(schemaDir, `${typeName.toLowerCase()}.json`);
      return generateTypeSchema(curationTs, typeName, outputPath, check);
    }),
  );

  return results.every((valid) => valid);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  if (CHECK_MODE) {
    console.log("Checking JSON schemas...\n");

    const schemaResults = await Promise.all(
      SCHEMA_VERSIONS.map((version) => generateSchema(version, true)),
    );

    const curationResults = await Promise.all(
      SCHEMA_VERSIONS.map((version) => generateCurationSchemas(version, true)),
    );

    const allValid =
      schemaResults.every((valid) => valid) &&
      curationResults.every((valid) => valid);

    console.log();
    if (!allValid) {
      console.error(
        "Error: Some schemas are out of date. Run: npm run generate:schema:json",
      );
      process.exit(1);
    } else {
      console.log("All schemas are up to date!");
    }
  } else {
    console.log("Generating JSON schemas...\n");

    await Promise.all(
      SCHEMA_VERSIONS.map((version) => generateSchema(version, false)),
    );

    console.log("\nGenerating curation manifest schemas...\n");

    await Promise.all(
      SCHEMA_VERSIONS.map((version) => generateCurationSchemas(version, false)),
    );

    console.log("\nSchema generation complete!");
  }
}

main().catch((error) => {
  console.error("Schema generation failed:", error);
  process.exit(1);
});
