import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { frontmatterValue } from "../tools/generate.mjs";

const skillsDir = fileURLToPath(new URL("../plugins/pstack/skills", import.meta.url));
const reflectPath = join(skillsDir, "reflect/SKILL.md");
const reflectText = readFileSync(reflectPath, "utf8");
const reflectDescription = frontmatterValue(reflectText, "description");
if (!reflectDescription) throw new Error(`${reflectPath}: reflect has no description`);

const baselineDescription =
  "Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.";

function normalize(text) {
  return text.toLowerCase().replace(/["']/g, "").replace(/\s+/g, " ").trim();
}

function matchesTrigger(description, request, phrase) {
  const normalizedPhrase = normalize(phrase);
  return normalize(description).includes(normalizedPhrase) && normalize(request).includes(normalizedPhrase);
}

const triggerCases = [
  {
    phase: "before the description edit",
    request: "Please synthesize reviewer findings from this transcript into skill edits.",
    phrase: "synthesize reviewer findings",
    expected: "skip",
  },
  {
    phase: "after the description edit",
    request: "Please synthesize reviewer findings from this transcript into skill edits.",
    phrase: "synthesize reviewer findings",
    expected: "match",
  },
  {
    phase: "after the description edit",
    request: "Review this implementation and list its defects.",
    phrase: "synthesize reviewer findings",
    expected: "skip",
  },
  {
    phase: "before the description edit",
    request: "Evaluate a skill trigger or behavior before edits for this request.",
    phrase: "evaluate a skill trigger or behavior before edits",
    expected: "skip",
  },
  {
    phase: "after the description edit",
    request: "Evaluate a skill trigger or behavior before edits for this request.",
    phrase: "evaluate a skill trigger or behavior before edits",
    expected: "match",
  },
  {
    phase: "after the description edit",
    request: "Rewrite this skill body for clarity after the edit is chosen.",
    phrase: "evaluate a skill trigger or behavior before edits",
    expected: "skip",
  },
];

describe("reflect skill trigger cases", () => {
  for (const { phase, request, phrase, expected } of triggerCases) {
    test(`${phase} ${expected} for ${phrase}`, () => {
      const description = phase.startsWith("before") ? baselineDescription : reflectDescription;
      expect(matchesTrigger(description, request, phrase)).toBe(expected === "match");
    });
  }
});

const behaviorCases = [
  {
    phase: "before an edit",
    evidence:
      "Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval.",
  },
  {
    phase: "after an edit",
    evidence: "If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.",
  },
];

describe("reflect skill edit behavior", () => {
  for (const { phase, evidence } of behaviorCases) {
    test(`keeps the required behavior ${phase}`, () => {
      expect(reflectText).toContain(evidence);
    });
  }
});
