```prompt
---
mode: agent
---

# Rules Alignment Command

Synchronize every instruction surface (`.github`, `.github/prompts`, `.cursor`, `codemaps`, and `.ai`) so that guidance, automation contracts, and command references stay identical across all tools.

## When to Run

- You edit or review any instruction, prompt, or command file across the repo
- You add, rename, or deprecate automation commands (for example `/cleanup`, `/codemap`)
- The codemap or project map changes and introduces new terminology or boundaries

## Preconditions

1. **Branch ready** – Work from a clean branch dedicated to the alignment session.
2. **Context loaded** – Review `.ai/structure.md`, the latest codemaps, and all instruction/prompt files you expect to touch.
3. **Tool surface audit** – List every AI/editor integration in use (GitHub prompts, Cursor commands, VS Code snippets, etc.) and locate their command definitions.
4. **Templates available** – Gather any command or instruction templates needed to regenerate files consistently.

## Alignment Workflow

Follow the cross-surface workflow defined in `.ai/structure.md` and expand as below:

1. **Inventory**
   - List every instruction and prompt artifact under `.github/`, `.github/prompts/`, `.cursor/`, `.ai/commands/`, and related docs.
   - Capture version metadata, owners, and last-updated timestamps when present.
2. **Validate Structure**
   - Compare the documented guidance against the current codemap/project structure.
   - Log discrepancies (missing sections, stale paths, outdated terminology) in a scratch pad.
3. **Normalize Guidance**
   - Draft a canonical summary of the desired rules, commands, and naming conventions.
   - Resolve conflicts—default to the latest codemap or project map when sources disagree.
4. **Emit Variants**
   - Update `.github/instructions` and `.github/prompts` first, then mirror the same content into `.cursor/instructions`, `.cursor/commands`, and any other tool-specific surfaces.
   - Regenerate supporting docs (`.ai/commands/*.md`, codemap notes, prompt manifests) so the wording matches verbatim where required.
   - Keep section ordering and normative language identical unless a tool format forces changes.
5. **Record Outcomes**
   - Replace the entry in the `Latest Alignment Summary` section of `.ai/structure.md` with the current run’s details (never append additional history).
   - Document completed updates, outstanding gaps, and owners in the Open Gaps section or session notes.
   - Include timestamps plus direct references to updated artifacts for traceability.

## Outputs & Verification

- ✅ All touched instruction and prompt files share synchronized content and normative wording.
- ✅ `.ai/commands/` documents the same behavior described in `.github` and `.cursor` surfaces.
- ✅ Codemap entries reference the updated commands or rules if applicable.
- ✅ Alignment summary or PR notes explain what changed and why.

## Post-Run Follow-Ups

- Log any pending tool conversions (for example, Cursor exports) under Open Gaps in `.ai/structure.md` with an action plan.
- Notify maintainers of automation or CI jobs consuming the updated instructions.
- Re-run `/rulesalign` after major structural changes or when onboarding a new instruction surface.

## Escalation Triggers

- **MUST pause** and request guidance if policies conflict and cannot be reconciled from current documentation.
- **SHOULD schedule** `/codemap` when mismatches stem from stale structural docs.
- **MAY defer** cosmetic-only discrepancies, but track the follow-up before ending the alignment session.
```
