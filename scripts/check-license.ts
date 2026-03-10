#!/usr/bin/env tsx

/*
 * Copyright 2026 Datastrato, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFileSync, readdirSync } from "fs";
import { join, relative, extname } from "path";

const ROOT_DIR = join(import.meta.dirname, "..");

const LICENSE_TEXT =
  "Copyright 2026 Datastrato, Inc.\n" +
  "\n" +
  'Licensed under the Apache License, Version 2.0 (the "License");\n' +
  "you may not use this file except in compliance with the License.\n" +
  "You may obtain a copy of the License at\n" +
  "\n" +
  "    http://www.apache.org/licenses/LICENSE-2.0\n" +
  "\n" +
  "Unless required by applicable law or agreed to in writing, software\n" +
  'distributed under the License is distributed on an "AS IS" BASIS,\n' +
  "WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n" +
  "See the License for the specific language governing permissions and\n" +
  "limitations under the License.";

const LICENSE_LINES = LICENSE_TEXT.split("\n");

// File extensions that use block comment style: /* ... */
const BLOCK_COMMENT_EXTS = new Set([".ts", ".mjs", ".js"]);
// File extensions that use hash comment style: # ...
const HASH_COMMENT_EXTS = new Set([".yaml", ".yml"]);

// Directories and extensions to check
const CHECK_DIRS: { dir: string; extensions: Set<string>; recursive: boolean }[] = [
  { dir: "schema", extensions: BLOCK_COMMENT_EXTS, recursive: true },
  { dir: "scripts", extensions: BLOCK_COMMENT_EXTS, recursive: true },
  { dir: "examples", extensions: HASH_COMMENT_EXTS, recursive: true },
  { dir: ".github/workflows", extensions: HASH_COMMENT_EXTS, recursive: true },
];

// Root-level files to check
const CHECK_ROOT_EXTENSIONS = new Set([".mjs"]);

function getFilesToCheck(): string[] {
  const files: string[] = [];

  // Check directories
  for (const { dir, extensions, recursive } of CHECK_DIRS) {
    const dirPath = join(ROOT_DIR, dir);
    try {
      const entries = readdirSync(dirPath, { recursive, withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && extensions.has(extname(entry.name))) {
          const parentPath = entry.parentPath ?? entry.path;
          files.push(join(parentPath, entry.name));
        }
      }
    } catch {
      // Directory may not exist
    }
  }

  // Check root-level files
  const rootEntries = readdirSync(ROOT_DIR, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isFile() && CHECK_ROOT_EXTENSIONS.has(extname(entry.name))) {
      files.push(join(ROOT_DIR, entry.name));
    }
  }

  return files.sort();
}

function stripCommentMarkers(line: string, ext: string): string {
  if (BLOCK_COMMENT_EXTS.has(ext)) {
    // Strip block comment markers: /*, */, leading " * "
    return line
      .replace(/^\/\*\s*/, "")
      .replace(/\s*\*\/$/, "")
      .replace(/^\s*\*\s?/, "")
      .trimEnd();
  }
  if (HASH_COMMENT_EXTS.has(ext)) {
    // Strip hash comment marker: "# " or "#"
    return line.replace(/^#\s?/, "").trimEnd();
  }
  return line;
}

function checkFile(filePath: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  const ext = extname(filePath);
  const lines = content.split("\n");

  // Skip shebang line if present
  let startIndex = 0;
  if (lines[0]?.startsWith("#!")) {
    startIndex = 1;
    // Skip blank line after shebang
    while (startIndex < lines.length && lines[startIndex].trim() === "") {
      startIndex++;
    }
  }

  // Find the license block: extract comment lines from the start
  const commentLines: string[] = [];
  let i = startIndex;

  if (BLOCK_COMMENT_EXTS.has(ext)) {
    // Look for /* ... */ block
    if (i < lines.length && lines[i].trimStart().startsWith("/*")) {
      while (i < lines.length) {
        commentLines.push(lines[i]);
        if (lines[i].includes("*/")) break;
        i++;
      }
    }
  } else if (HASH_COMMENT_EXTS.has(ext)) {
    // Collect consecutive # lines
    while (i < lines.length && (lines[i].startsWith("#") || lines[i].trim() === "")) {
      if (lines[i].startsWith("#")) {
        commentLines.push(lines[i]);
      } else if (commentLines.length > 0) {
        // Blank line within comment block — check if next line is still a comment
        if (i + 1 < lines.length && lines[i + 1].startsWith("#")) {
          commentLines.push(lines[i]);
        } else {
          break;
        }
      }
      i++;
    }
  }

  if (commentLines.length === 0) return false;

  // Strip comment markers and check if license text is present
  const stripped = commentLines.map((line) => stripCommentMarkers(line, ext));
  const strippedText = stripped.join("\n");

  return LICENSE_LINES.every((licenseLine) => strippedText.includes(licenseLine));
}

// Main
const files = getFilesToCheck();
const failures: string[] = [];

for (const file of files) {
  if (!checkFile(file)) {
    failures.push(relative(ROOT_DIR, file));
  }
}

if (failures.length > 0) {
  console.error("Missing or invalid license header in the following files:\n");
  for (const f of failures) {
    console.error(`  ✗ ${f}`);
  }
  console.error(`\n${failures.length} file(s) missing license header.`);
  process.exit(1);
} else {
  console.log(`✓ All ${files.length} file(s) have valid license headers.`);
}
