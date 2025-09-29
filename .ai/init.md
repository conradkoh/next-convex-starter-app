# AI Assistant Initialization Guide

Follow these steps in order. Only open the referenced files when the step instructs you to, so context stays fresh and the workflow remains reliable.

## Step 0 · Prepare the workspace

- Confirm the git working directory is clean.
- Make note of the current branch that will hold alignment changes.
- Close any instruction files you already have open.

## Step 1 · Load the framework (read now, then close)

1. Open `.ai/structure.md`.
2. Read it top to bottom once, paying special attention to:
   - “Latest Alignment Summary” for prior outcomes or pending gaps.
   - “Instruction Surfaces Overview” and the per-surface sections.
   - “Cross-Surface Alignment Workflow” and “Command Contracts”.
3. Close the file after reading—refer back only if a later step explicitly tells you to.

## Step 2 · Distribute command definitions

Process each file in `.ai/commands/` one at a time:

1. Open a command file (for example `rulesalign.md`) and follow its instructions.
2. Copy/adapt the command into the locations listed under “Emit Variants” inside that command (e.g. `.github/prompts/`, `.cursor/commands/`).
3. Finish syncing that command before moving to the next file.
4. When all commands are mirrored, run the `/rulesalign` instructions in the command doc to verify surfaces stay in sync.

## Step 3 · Inspect the project structure

1. Review repository configuration files that describe workspace boundaries (e.g. `pnpm-workspace.yaml`, `nx.json`, `package.json`, or tool-specific configs).
2. Walk the top-level directories (`apps/`, `services/`, `packages/`, etc.) to confirm actual layout.
3. Record the workspace names, shared libraries, and any special tooling you discover—these inform scope-specific rules.

## Step 4 · Author scope-specific rules

1. Re-open `.ai/structure.md` only for the sections that describe the surfaces you are editing (e.g. `.github` or `.cursor`).
2. For each scope identified in Step 3, create or update the corresponding instruction files:
   - `.github/instructions/*.instructions.md`
   - `.cursor/instructions/*.mdc`
3. Use the framework’s guidance and your Step 3 notes to tailor rules to each workspace or feature area.
4. After each file is updated, close it and note any outstanding follow-ups in the “Open Gaps” section of `.ai/structure.md`.

## Step 5 · Document the architecture

1. Open `codemaps/projectmap.md` (or the template in `codemaps/templates/` if it does not exist).
2. Populate or refresh the project map using the information gathered in Step 3 and the finalized instructions from Step 4.
3. Keep the project map focused on structure—do not restate rules already captured in instruction files.

## Step 6 · Finalize and verify

1. Re-run the `/rulesalign` command to ensure every surface is synchronized.
2. Confirm the “Latest Alignment Summary” in `.ai/structure.md` reflects this session and still contains only a single entry.
3. Ensure “Open Gaps” is accurate (either list pending work or state “None”).
4. Stage changes and prepare them for review according to repository conventions.

---

By following this staged process, agents rely on authoritative sources exactly when needed, avoid duplicating guidance, and keep all instruction surfaces aligned across the project.
