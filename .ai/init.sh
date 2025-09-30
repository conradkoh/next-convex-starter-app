#!/bin/bash

# AI Assistant Initialization Script
# Automates the distribution of commands from .ai/commands/ to appropriate surfaces
# with correct headers and file formats.

set -e  # Exit on error

# Help function
show_help() {
    cat << EOF
Usage: init.sh [OPTIONS]

Automates the distribution of AI assistant commands and instructions to all
configured surfaces (GitHub Copilot, Cursor, etc.).

OPTIONS:
    --dry-run, -n    Preview changes without modifying files
    --help, -h       Show this help message

EXAMPLES:
    # Preview what would be changed
    .ai/init.sh --dry-run

    # Apply changes
    .ai/init.sh

PROCESS:
    1. Verifies git working directory is clean
    2. Creates target directories if needed
    3. Distributes commands from .ai/commands/ to:
       - .github/prompts/*.prompt.md
       - .cursor/commands/*.md
    4. Syncs instructions from .github/instructions/ to:
       - .cursor/instructions/*.mdc

SOURCE OF TRUTH:
    • Commands: .ai/commands/*.md
    • Instructions: .github/instructions/*.instructions.md
    • Tool-specific rules: Preserved, not modified

For more information, see .ai/README.md
EOF
}

# Parse arguments
DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run|-n)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Error: Unknown option: $arg"
            echo "Run 'init.sh --help' for usage information."
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the repository root directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}  AI Assistant Initialization (DRY RUN)${NC}"
else
    echo -e "${BLUE}  AI Assistant Initialization${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo

# Step 0: Check git status
echo -e "${YELLOW}Step 0: Checking git working directory...${NC}"
if [[ -n $(git status --porcelain) ]]; then
    if [ "$DRY_RUN" = false ]; then
        echo -e "${RED}✗ Git working directory is not clean.${NC}"
        echo -e "${YELLOW}  Please commit or stash your changes before running init.${NC}"
        echo -e "${YELLOW}  Or run with --dry-run to preview changes.${NC}"
        exit 1
    else
        echo -e "${YELLOW}⚠ Git working directory is not clean (dry run mode)${NC}"
    fi
else
    echo -e "${GREEN}✓ Git working directory is clean${NC}"
fi
CURRENT_BRANCH=$(git branch --show-current)
echo -e "  Current branch: ${BLUE}${CURRENT_BRANCH}${NC}"
echo

# Step 1: Create target directories if they don't exist
echo -e "${YELLOW}Step 1: Ensuring target directories exist...${NC}"
if [ "$DRY_RUN" = false ]; then
    mkdir -p .github/prompts
    mkdir -p .cursor/commands
    mkdir -p .cursor/instructions
    mkdir -p .cursor/rules
    echo -e "${GREEN}✓ Target directories verified${NC}"
else
    echo -e "${BLUE}→ Would create: .github/prompts${NC}"
    echo -e "${BLUE}→ Would create: .cursor/commands${NC}"
    echo -e "${BLUE}→ Would create: .cursor/instructions${NC}"
    echo -e "${BLUE}→ Would create: .cursor/rules${NC}"
fi
echo

# Step 2: Process command files from .ai/commands/
echo -e "${YELLOW}Step 2: Distributing commands from .ai/commands/...${NC}"

if [ ! -d ".ai/commands" ]; then
    echo -e "${RED}✗ Directory .ai/commands/ not found${NC}"
    exit 1
fi

COMMAND_COUNT=0
for cmd_file in .ai/commands/*.md; do
    if [ ! -f "$cmd_file" ]; then
        continue
    fi
    
    COMMAND_COUNT=$((COMMAND_COUNT + 1))
    basename=$(basename "$cmd_file")
    name="${basename%.md}"
    
    echo -e "  ${BLUE}Processing: ${basename}${NC}"
    
    # Read the content (skip if file doesn't exist)
    if [ ! -f "$cmd_file" ]; then
        echo -e "    ${RED}✗ Source file not found${NC}"
        continue
    fi
    
    # GitHub Prompts: Add frontmatter header, keep content, change extension to .prompt.md
    github_target=".github/prompts/${name}.prompt.md"
    if [ "$DRY_RUN" = false ]; then
        echo "---" > "$github_target"
        echo "mode: agent" >> "$github_target"
        echo "---" >> "$github_target"
        echo "" >> "$github_target"
        cat "$cmd_file" >> "$github_target"
        echo -e "    ${GREEN}✓ Synced to .github/prompts/${name}.prompt.md${NC}"
    else
        echo -e "    ${BLUE}→ Would sync to .github/prompts/${name}.prompt.md${NC}"
    fi
    
    # Cursor Commands: Add frontmatter header, keep content
    cursor_target=".cursor/commands/${name}.md"
    if [ "$DRY_RUN" = false ]; then
        echo "---" > "$cursor_target"
        echo "mode: agent" >> "$cursor_target"
        echo "---" >> "$cursor_target"
        echo "" >> "$cursor_target"
        cat "$cmd_file" >> "$cursor_target"
        echo -e "    ${GREEN}✓ Synced to .cursor/commands/${name}.md${NC}"
    else
        echo -e "    ${BLUE}→ Would sync to .cursor/commands/${name}.md${NC}"
    fi
    
done

if [ $COMMAND_COUNT -eq 0 ]; then
    echo -e "${YELLOW}  No command files found in .ai/commands/${NC}"
else
    echo -e "${GREEN}✓ Distributed ${COMMAND_COUNT} command(s)${NC}"
fi
echo

# Step 3: Sync instruction files from .github/instructions/ to .cursor/instructions/
echo -e "${YELLOW}Step 3: Syncing instruction files...${NC}"

if [ -d ".github/instructions" ]; then
    INSTRUCTION_COUNT=0
    for inst_file in .github/instructions/*.instructions.md; do
        if [ ! -f "$inst_file" ]; then
            continue
        fi
        
        INSTRUCTION_COUNT=$((INSTRUCTION_COUNT + 1))
        basename=$(basename "$inst_file")
        name="${basename%.instructions.md}"
        
        echo -e "  ${BLUE}Processing: ${basename}${NC}"
        
        # Cursor Instructions: Convert to .mdc format
        cursor_target=".cursor/instructions/${name}.mdc"
        
        if [ "$DRY_RUN" = false ]; then
            # Read the original file and convert frontmatter from --- to <!-- -->
            {
                in_frontmatter=false
                first_line=true
                
                while IFS= read -r line; do
                    if [ "$line" = "---" ]; then
                        if [ "$first_line" = true ]; then
                            echo "<!--"
                            in_frontmatter=true
                            first_line=false
                        elif [ "$in_frontmatter" = true ]; then
                            echo "-->"
                            echo ""
                            in_frontmatter=false
                        fi
                    else
                        echo "$line"
                        first_line=false
                    fi
                done < "$inst_file"
            } > "$cursor_target"
            
            echo -e "    ${GREEN}✓ Synced to .cursor/instructions/${name}.mdc${NC}"
        else
            echo -e "    ${BLUE}→ Would sync to .cursor/instructions/${name}.mdc${NC}"
        fi
    done
    
    if [ $INSTRUCTION_COUNT -eq 0 ]; then
        echo -e "${YELLOW}  No instruction files found in .github/instructions/${NC}"
    else
        echo -e "${GREEN}✓ Synced ${INSTRUCTION_COUNT} instruction file(s)${NC}"
    fi
else
    echo -e "${YELLOW}  Directory .github/instructions/ not found, skipping...${NC}"
fi
echo

# Step 4: Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${GREEN}✓ Dry run complete! No files were modified.${NC}"
else
    echo -e "${GREEN}✓ Initialization complete!${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
echo -e "${YELLOW}Summary:${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "  • Would distribute ${COMMAND_COUNT} command(s) from .ai/commands/"
else
    echo -e "  • Distributed ${COMMAND_COUNT} command(s) from .ai/commands/"
fi
echo -e "  • Command targets:"
echo -e "    - .github/prompts/*.prompt.md"
echo -e "    - .cursor/commands/*.md"
if [ -d ".github/instructions" ]; then
    if [ "$DRY_RUN" = true ]; then
        echo -e "  • Would sync instruction files from .github/instructions/"
    else
        echo -e "  • Synced instruction files from .github/instructions/"
    fi
    echo -e "  • Instruction targets:"
    echo -e "    - .cursor/instructions/*.mdc"
fi
echo
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Run without --dry-run to apply changes: ${BLUE}.ai/init.sh${NC}"
    echo -e "  2. Or review the command files in .ai/commands/"
else
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Review the changes: ${BLUE}git status${NC}"
    echo -e "  2. Verify the synced files look correct"
    echo -e "  3. Commit the changes to branch: ${BLUE}${CURRENT_BRANCH}${NC}"
fi
echo
echo -e "${YELLOW}Note:${NC}"
echo -e "  • This script treats .ai/commands/*.md as the source of truth"
echo -e "  • Instruction files use .github/instructions/*.instructions.md as canonical"
echo -e "  • Tool-specific rules in .cursor/rules/ are preserved (not modified)"
if [ "$DRY_RUN" = true ]; then
    echo -e "  • Run ${BLUE}.ai/init.sh${NC} without --dry-run to apply changes"
fi
echo
