#!/usr/bin/env node
/**
 * Reminds agents to update canon docs before git commit.
 * See project_docs/DOCUMENTATION_MAINTENANCE.md
 */
import { stdin } from "node:process";

async function readStdin() {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const raw = await readStdin();
let command = "";
try {
  command = JSON.parse(raw || "{}").command ?? "";
} catch {
  command = "";
}

const isCommit = /\bgit\s+commit\b/.test(command);

if (isCommit) {
  console.log(
    JSON.stringify({
      permission: "allow",
      agent_message: [
        "Documentation check before commit:",
        "Follow project_docs/DOCUMENTATION_MAINTENANCE.md.",
        "1) Verify CONTEXT.md (stack, folders, links).",
        "2) Update the canonical deep doc for areas you changed.",
        "3) Add recurring Pixi/TS pitfalls to project_docs/lessons-learned.md.",
        "4) Do not add Taskmaster / Jest / @pixi/react / Phaser docs.",
        "If docs are already updated for this change set, proceed with the commit.",
      ].join(" "),
    }),
  );
} else {
  console.log(JSON.stringify({ permission: "allow" }));
}
