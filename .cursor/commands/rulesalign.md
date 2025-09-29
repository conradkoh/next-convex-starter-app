---
mode: agent
---

# Rules Alignment Command

## Purpose

Execute the Cross-Surface Alignment Workflow to synchronize instruction files across all supported tooling surfaces (`.github`, `.cursor`, and `codemaps`). This command ensures that AI assistant guidance remains consistent across GitHub Copilot, Cursor, and other tools.

## Main Process

**Follow this 5-step alignment workflow to synchronize all instruction surfaces:**

### 1. Inventory Existing Instructions

**Action**: Inspect every instruction file under `.github` and `.cursor` directories.

**What to do:**

- List all files in `.github/instructions/` (if exists)
- List all files in `.cursor/instructions/` (if exists)
- Review each file for accuracy and completeness
- Consult supporting meta-docs in `.ai/` for prior notes and context

### 2. Validate Structure Against Codemap

**Action**: Compare current instructions against the most recent codemap to ensure structural accuracy.

**What to do:**

- Check if `codemaps/projectmap.md` exists and is current
- Verify that instruction file references match actual module hierarchy
- Identify any mismatches between documented paths and actual structure
- If no codemap exists, record this gap and schedule regeneration

### 3. Normalize Guidance

**Action**: Draft tool-agnostic summary of changes before producing tool-specific formatting.

**What to do:**

- Create a unified understanding of what guidance needs to be applied
- Identify core principles that should be consistent across all tools
- Document any tool-specific variations that are intentional
- Prepare content that can be adapted to different instruction formats

### 4. Emit Instruction Variants

**Action**: Update `.github` instructions first, then propagate identical content to `.cursor`.

**What to do:**

- Create or update `.github/instructions/` directory structure
- Create instruction files with consistent suffix (`.instructions.md`)
- Ensure global/core instruction file exists for always-on context
- Create `.cursor/instructions/` directory structure
- Mirror `.github` content in Cursor-compatible format (`.mdc` or similar)
- Maintain semantic consistency while adapting formatting as needed

### 5. Record Outcomes

**Action**: Document alignment results and any outstanding tasks.

**What to do:**

- Update the AI Instruction Surface Framework with summary of changes
- Record any deviations or exceptions with justification
- Document outstanding follow-ups in Open Gaps section
- Add timestamps and version markers to instruction files

## Directory Structure Requirements

### `.github` Instruction Surface

**MUST exist:**

- `.github/instructions/` directory
- Core instruction file for global context
- Scope-specific files (backend, frontend, general, etc.)

**File naming:**

- Use consistent suffix: `.instructions.md`
- Group by scope: `general.instructions.md`, `backend.instructions.md`

**Content requirements:**

- Include sections: "Directives", "Constraints", "Examples"
- Keep tooling references and paths accurate
- Place universal guidance in general document

### `.cursor` Instruction Surface

**MUST exist:**

- `.cursor/instructions/` directory (even as placeholder)
- Mirror of `.github` structure and content

**File naming:**

- Use Cursor-compatible extensions: `.mdc` or similar
- Mirror section names and ordering from `.github`

**Content requirements:**

- Express same guidance as corresponding `.github` file
- Adapt formatting for Cursor syntax while keeping rules identical
- Use placeholder files if content synchronization is pending

### `codemaps` Structural Surface

**MUST maintain:**

- Current structural documentation in `codemaps/`
- Timestamped artifacts with version markers
- Archive older maps under `codemaps/archive/` when superseded

## Alignment Checklist

Use this checklist to verify complete alignment:

- [ ] **Inventory Complete**: All instruction files identified and reviewed
- [ ] **Structure Validated**: Instructions match current codemap structure
- [ ] **GitHub Updated**: All `.github/instructions/` files created/updated
- [ ] **Cursor Synchronized**: All `.cursor/instructions/` files match GitHub content
- [ ] **Gaps Documented**: Any outstanding work recorded in framework
- [ ] **Outcomes Recorded**: Summary added to AI Instruction Surface Framework

## Normative Requirements

This command **MUST** follow these requirements from the AI Instruction Surface Framework:

- **MUST** update every affected instruction file within the same alignment session
- **MUST** maintain semantic consistency between `.github` and `.cursor` versions
- **MUST** consult most recent codemap to verify module and path references
- **SHOULD** document any deviations with justification in Open Gaps
- **MAY** use automation to convert formats, provided content remains identical

## Error Handling

If alignment encounters issues:

1. **Missing Codemap**: Record gap and note that structural validation is deferred
2. **Directory Creation**: Create required directory structures if they don't exist
3. **Content Conflicts**: Prioritize `.github` as source of truth, document exceptions
4. **Format Conversion**: Manual editing acceptable if automation unavailable

## Success Criteria

Alignment is complete when:

- All instruction surfaces contain consistent guidance
- Directory structures follow framework requirements
- Outstanding work is documented with owners/dates
- Framework is updated with alignment summary
- Next alignment session can build on current state

## Example Workflow

```bash
# 1. Review current state
ls -la .github/instructions/ 2>/dev/null || echo "GitHub instructions missing"
ls -la .cursor/instructions/ 2>/dev/null || echo "Cursor instructions missing"
ls -la codemaps/projectmap.md 2>/dev/null || echo "Projectmap missing"

# 2. Create directories if needed
mkdir -p .github/instructions
mkdir -p .cursor/instructions

# 3. Apply alignment workflow (steps 1-5 above)
# 4. Verify results with checklist
# 5. Document outcomes in framework
```

## Integration with Other Commands

- **Before `/cleanup`**: Run alignment to ensure cleanup follows current guidance
- **After `/codemap`**: Run alignment to incorporate structural changes
- **Standalone**: Run periodically to maintain instruction synchronization

---

This command implements the `/alignrules` contract defined in the AI Instruction Surface Framework and ensures consistent AI assistant behavior across all supported tools.
