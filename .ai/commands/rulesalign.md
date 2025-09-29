# `/rulesalign`

The `/rulesalign` command synchronizes every instruction surface (.github, .cursor, codemaps, and `.ai`) so that tooling guidance, automation contracts, and command references remain identical across editors.

## When to Run

- Initiating or reviewing changes to any instruction files under `.github/` or `.cursor/`
- Adding, renaming, or deprecating commands referenced by automation (for example `/cleanup`, `/codemap`)
- After codemap updates that introduce new instruction boundaries or terminology

## Preconditions

1. **Branch preparation**: Work on a dedicated branch with a clean git status before starting alignment.
2. **Context gathering**: Review `.ai/structure.md`, the latest entries in `codemaps/`, and all instruction files that will be modified.
3. **Tool surface audit**: Enumerate every AI/editor integration in use (for example GitHub prompts, Cursor commands, VS Code snippets) and note the files that define the shared commands.
4. **Template readiness**: Ensure command or instruction templates (if any) are available so regenerated files follow repository conventions.

## Alignment Workflow

Follow the cross-surface workflow defined in `.ai/structure.md` and expand each step as described below:

1. **Inventory**
   - List every instruction artifact across `.github/`, `.github/prompts/` (or equivalent), `.cursor/`, `.ai/commands/`, and related docs.
   - Note version metadata, owners, or last-updated dates if present.
2. **Validate Structure**
   - Compare instructions against the current codemap hierarchy and project layout.
   - Record any discrepancies (missing sections, outdated file paths, stale terminology) in a scratch log.
3. **Normalize Guidance**
   - Draft a canonical summary of the desired rules, commands, and terminology.
   - Resolve conflicts between sources; when unsure, prefer the most recent codemap or project map descriptions.
4. **Emit Variants**
   - Update `.github/instructions` and corresponding `.github/prompts/` (or other GitHub command surfaces) first, then mirror equivalent guidance into `.cursor/instructions` and any additional tool-specific locations.
   - Regenerate supporting docs (`.ai/commands/*.md`, codemap notes, prompt manifests) so the same rules appear verbatim where required.
   - Maintain identical section ordering unless a tool mandates alternative formatting.
5. **Record Outcomes**
   - Replace the entry in the `Latest Alignment Summary` section of `.ai/structure.md` with the current run’s details (do not append additional history).
   - Document completed updates, outstanding gaps, and follow-up owners inside the Open Gaps section or the relevant session notes.
   - Include timestamps and references to the updated artifacts for traceability.

## Outputs & Verification

- ✅ All instruction files edited during the session share synchronized content and normative language.
- ✅ Command documentation in `.ai/commands/` reflects the same behavior described in `.github` and `.cursor` surfaces.
- ✅ Codemap(s) reference the updated commands or rules when applicable.
- ✅ A concise alignment summary (changelog, pull-request notes, or log entry) captures what changed and why.

## Post-Run Follow-Ups

- If any tool-specific conversion is pending (for example, regenerating Cursor-formatted docs), add an entry under “Open Gaps” in `.ai/structure.md` with a remediation plan.
- Notify collaborators who maintain automation or CI systems that consume the updated instructions.
- Re-run `/rulesalign` after substantial structural refactors or when onboarding new instruction surfaces.

## Escalation Triggers

- **MUST stop** and request guidance if conflicting policies cannot be reconciled from available sources.
- **SHOULD schedule** a codemap regeneration (`/codemap`) when instruction mismatches stem from outdated structural documentation.
- **MAY defer** low-risk cosmetic differences (formatting-only) but must log them as follow-ups if left unresolved.
