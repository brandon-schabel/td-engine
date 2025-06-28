# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principles

- **TDD**: Write tests FIRST, ensure they pass after implementation
- **No `any`**: Use strong typing, Zod schemas for unknown shapes  
- **Functional style**: Pure functions, single responsibility, descriptive names
- **UNIT TESTING ONLY**: No integration tests. Break down code until it's unit testable
- **File Safety**: NEVER delete files outside `/Users/brandon/Programming/td-engine`

### OctoPrompt MCP Usage

**PRIORITY SYSTEM**: Always prioritize OctoPrompt MCP for project management, file operations, and AI-powered workflows. This is our primary project management system.

The OctoPrompt MCP provides comprehensive integration with the OctoPrompt project management system, offering 30+ specialized tools for managing projects, files, prompts, tickets, tasks, and AI-powered workflows directly from Claude.

**TD Engine OctoPrompt Project Details:**

- **Project ID**: `1750564556414`

**Core Philosophy**:

- Use OctoPrompt for ALL project planning and management
- Create tickets and tasks for any feature development
- Store and retrieve prompts for reusable workflows
- Leverage AI-powered file suggestions and optimizations
- Always write feedback to `octo-feedback.md` on improvements

## Available MCP Tools (30+ tools)

### 🏗️ Project Management Tools

- `mcp_octoprompt_project_list` - List all available projects
- `mcp_octoprompt_project_get` - Get detailed project information
- `mcp_octoprompt_project_create` - Create new projects
- `mcp_octoprompt_project_update` - Update project details
- `mcp_octoprompt_project_delete` - Delete projects
- `mcp_octoprompt_project_summary` - Get AI-generated project overviews

### 📁 File Operations Tools

- `mcp_octoprompt_file_read` - Read file contents from project
- `mcp_octoprompt_file_write` - Write/update file contents
- `mcp_octoprompt_file_list` - List project files (recursive support)
- `mcp_octoprompt_suggest_files` - AI-powered file suggestions based on context

### 🧠 AI-Powered Tools

- `mcp_octoprompt_optimize_user_input` - Enhance prompts with project context
- `mcp_octoprompt_project_summary` - Generate intelligent project summaries
- `mcp_octoprompt_suggest_files` - Context-aware file recommendations

### 📝 Prompt Management Tools

- `mcp_octoprompt_prompt_list` - List all available prompts
- `mcp_octoprompt_prompt_get` - Retrieve specific prompt details
- `mcp_octoprompt_prompt_create` - Create new reusable prompts
- `mcp_octoprompt_prompt_update` - Update existing prompts
- `mcp_octoprompt_prompt_delete` - Delete prompts
- `mcp_octoprompt_prompt_list_by_project` - Get project-specific prompts
- `mcp_octoprompt_prompt_add_to_project` - Associate prompts with projects
- `mcp_octoprompt_prompt_remove_from_project` - Remove prompt associations

### 🎫 Ticket Management Tools

- `mcp_octoprompt_ticket_list` - List tickets with status filtering
- `mcp_octoprompt_ticket_get` - Get detailed ticket information
- `mcp_octoprompt_ticket_create` - Create new tickets for features/bugs
- `mcp_octoprompt_ticket_update` - Update ticket details and status
- `mcp_octoprompt_ticket_delete` - Delete tickets
- `mcp_octoprompt_ticket_list_with_task_count` - Get tickets with task progress

### ✅ Task Management Tools

- `mcp_octoprompt_task_create` - Create tasks within tickets
- `mcp_octoprompt_task_list` - List all tasks for a ticket
- `mcp_octoprompt_task_update` - Update task content and completion status
- `mcp_octoprompt_task_delete` - Delete tasks
- `mcp_octoprompt_task_reorder` - Reorder tasks within tickets

### 🤖 AI-Enhanced Ticket Tools

- `mcp_octoprompt_ticket_suggest_tasks` - AI-generated task suggestions
- `mcp_octoprompt_ticket_auto_generate_tasks` - Auto-create tasks from ticket overview
- `mcp_octoprompt_ticket_suggest_files` - Get relevant files for ticket work(useful for quickly finding relevant files)

### 🔧 Fixes Management Tools

- `mcp_octoprompt_fix_list` - List all available fixes with filtering options
- `mcp_octoprompt_fix_get` - Get detailed information about a specific fix
- `mcp_octoprompt_fix_create` - Log new fixes with problem/solution details
- `mcp_octoprompt_fix_update` - Update existing fix information
- `mcp_octoprompt_fix_delete` - Delete obsolete fixes
- `mcp_octoprompt_fix_search` - Search for relevant fixes based on problem context
- `mcp_octoprompt_fix_list_by_project` - Get project-specific fixes

## Workflow Patterns

### 1. Feature Development Workflow

```typescript
// Start with project summary
mcp_octoprompt_project_summary({ include_files: true })

// Create ticket for new feature
mcp_octoprompt_ticket_create({
  projectId: 1750564556414,
  title: "Implement new tower type",
  overview: "Add ice tower with slow effect",
  priority: "high"
})

// Auto-generate tasks
mcp_octoprompt_ticket_auto_generate_tasks({ ticketId: newTicketId })

// Get suggested files
mcp_octoprompt_ticket_suggest_files({ ticketId: newTicketId })
```

### 2. Code Analysis & Planning

```typescript
// Get AI file suggestions for specific work
mcp_octoprompt_suggest_files({ 
  prompt: "files related to tower configuration and rendering",
  limit: 10 
})

// Optimize prompts with project context
mcp_octoprompt_optimize_user_input({
  prompt: "help me add a new tower type"
})
```

### 3. Prompt Library Management

```typescript
// Save useful prompts for later
mcp_octoprompt_prompt_create({
  name: "Tower Implementation Pattern",
  content: "When adding new towers: 1) Update TowerType enum...",
  projectId: 1750564556414
})

// Retrieve project-specific prompts
mcp_octoprompt_prompt_list_by_project({ projectId: 1750564556414 })
```

### 4. Fixes & Solutions Management

```typescript
// Search for existing fixes before creating new ones
mcp_octoprompt_fix_search({
  query: "TypeScript compilation errors",
  projectId: 1750564556414
})

// Log a new fix for future reference
mcp_octoprompt_fix_create({
  title: "Fix: TypeScript strict mode errors",
  problem: "Compilation fails with strict mode enabled",
  solution: "Update tsconfig.json and add proper type annotations",
  tags: ["typescript", "compilation", "strict-mode"],
  projectId: 1750564556414
})

// Retrieve project-specific fixes
mcp_octoprompt_fix_list_by_project({ projectId: 1750564556414 })

// Get detailed fix information
mcp_octoprompt_fix_get({ fixId: 123 })
```

## When to Use OctoPrompt MCP

**ALWAYS use OctoPrompt for:**

- Feature planning and task breakdown
- Project structure analysis and summaries
- File discovery and suggestions
- Prompt optimization and storage
- Ticket and task management
- Code organization insights
- Logging and retrieving common fixes and solutions
- Searching for existing solutions to known problems

**Prioritize over standard tools when:**

- Need project context-aware suggestions
- Working with large codebases
- Planning complex features
- Need AI-enhanced project insights
- Managing development workflows
- Encountering recurring technical issues
- Need to document solutions for team knowledge sharing

# Using Gemini CLI for Large Codebase Analysis

  When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
  context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

  Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
   gemini command:

### Examples

  **Single file analysis:**

  ```bash
  gemini -p "@src/main.py Explain this file's purpose and structure"

  Multiple files:
  gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

  Entire directory:
  gemini -p "@src/ Summarize the architecture of this codebase"

  Multiple directories:
  gemini -p "@src/ @tests/ Analyze test coverage for the source code"

  Current directory and subdirectories:
  gemini -p "@./ Give me an overview of this entire project"
  
#
 Or use --all_files flag:
  gemini --all_files -p "Analyze the project structure and dependencies"

  Implementation Verification Examples

  Check if a feature is implemented:
  gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

  Verify authentication implementation:
  gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

  Check for specific patterns:
  gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

  Verify error handling:
  gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

  Check for rate limiting:
  gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

  Verify caching strategy:
  gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

  Check for specific security measures:
  gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

  Verify test coverage for features:
  gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

  When to Use Gemini CLI

  Use gemini -p when:
  - Analyzing entire codebases or large directories
  - Comparing multiple large files
  - Need to understand project-wide patterns or architecture
  - Current context window is insufficient for the task
  - Working with files totaling more than 100KB
  - Verifying if specific features, patterns, or security measures are implemented
  - Checking for the presence of certain coding patterns across the entire codebase

  Important Notes

  - Paths in @ syntax are relative to your current working directory when invoking gemini
  - The CLI will include file contents directly in the context
  - No need for --yolo flag for read-only analysis
  - Gemini's context window can handle entire codebases that would overflow Claude's context
  - When checking implementations, be specific about what you're looking for to get accurate results # Using Gemini CLI for Large Codebase Analysis


  When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
  context window. Use `gemini -p` to leverage Google Gemini's large context capacity.


  ## File and Directory Inclusion Syntax


  Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
   gemini command:


  ### Examples:


  **Single file analysis:**
  ```bash
  gemini -p "@src/main.py Explain this file's purpose and structure"


  Multiple files:
  gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"


  Entire directory:
  gemini -p "@src/ Summarize the architecture of this codebase"


  Multiple directories:
  gemini -p "@src/ @tests/ Analyze test coverage for the source code"


  Current directory and subdirectories:
  gemini -p "@./ Give me an overview of this entire project"
  # Or use --all_files flag:
  gemini --all_files -p "Analyze the project structure and dependencies"


  Implementation Verification Examples


  Check if a feature is implemented:
  gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"


  Verify authentication implementation:
  gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"


  Check for specific patterns:
  gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"


  Verify error handling:
  gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"


  Check for rate limiting:
  gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"


  Verify caching strategy:
  gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"


  Check for specific security measures:
  gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"


  Verify test coverage for features:
  gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"


  When to Use Gemini CLI


  Use gemini -p when:
  - Analyzing entire codebases or large directories
  - Comparing multiple large files
  - Need to understand project-wide patterns or architecture
  - Current context window is insufficient for the task
  - Working with files totaling more than 100KB
  - Verifying if specific features, patterns, or security measures are implemented
  - Checking for the presence of certain coding patterns across the entire codebase


  Important Notes


  - Paths in @ syntax are relative to your current working directory when invoking gemini
  - The CLI will include file contents directly in the context
  - No need for --yolo flag for read-only analysis
  - Gemini's context window can handle entire codebases that would overflow Claude's context
  - When checking implementations, be specific about what you're looking for to get accurate results
```

## Environment & Commands

- **Runtime**: Bun 1.2+ (always use bun, not npm)
- **TypeScript**: Strict mode, path mapping (`@/` → `src/`)

```bash
bun dev          # Development server
bun test         # Run tests  
bun typecheck    # Type checking
bun build        # Production build
```

## UI System Architecture

### UI Element Abstractions

The UI uses a utility-first CSS system with high-level element abstractions. **Always use these abstractions instead of manual DOM creation**:

```typescript
// ✅ CORRECT - Use element abstractions
import { createButton, createCard, createHeader, cn } from '@/ui/elements';

const button = createButton({
  text: 'Save',
  variant: 'primary',
  icon: IconType.SAVE,
  onClick: handleSave
});

// ❌ WRONG - Don't create DOM manually
const button = document.createElement('button');
button.className = 'ui-button';
button.style.backgroundColor = 'blue';
```

**Available Elements:**

- **Buttons**: `createButton`, `createIconButton`, `createCloseButton`
- **Cards**: `createCard`, `createStructuredCard`, `createClickableCard`  
- **Headers**: `createHeader`, `createDialogHeader`, `createCompactHeader`
- **Forms**: `createInput`, `createSelect`, `createToggle`, `createSlider`
- **Display**: `createStatDisplay`, `createResourceDisplay`, `createIconContainer`
- **Navigation**: `createTabBar`, `createTooltip`

### Styling Rules

1. **Use utility classes** for all styling (400+ available in `UtilityStyles.ts`)
2. **NO inline styles** - Never use `element.style` or `style.cssText`
3. **Compose utilities** - Build complex styles by combining utility classes
4. **Design tokens** - All values come from configuration as CSS variables

```typescript
// ✅ CORRECT - Utility classes
element.className = cn('bg-surface-primary', 'p-4', 'rounded-lg', 'shadow-md');

// ❌ WRONG - Inline styles
element.style.backgroundColor = '#333';
element.style.padding = '16px';
```

### FloatingUIManager & UIController

All UI dialogs and popups use the centralized `FloatingUIManager`:

```typescript
// Access through UIController
game.uiController.showBuildMenu(x, y, callback);
game.uiController.showTowerUpgrade(tower);
game.uiController.showInventory();

// Or create custom dialogs
const floatingUI = game.getFloatingUIManager();
const element = floatingUI.createDialog({
  id: 'my-dialog',
  title: 'Dialog Title',
  content: createContent(),
  onClose: () => cleanup()
});
```

### Creating New UI Components

Follow this pattern for new UI:

```typescript
export class NewDialogUI {
  private game: Game;
  private element: FloatingUIElement | null = null;
  
  show(): void {
    const content = document.createElement('div');
    content.className = cn('p-4', 'space-y-4');
    
    // Use element abstractions
    const header = createHeader({
      title: 'Section Title',
      icon: IconType.INFO
    });
    
    const button = createButton({
      text: 'Confirm',
      variant: 'primary',
      onClick: () => this.handleAction()
    });
    
    content.appendChild(header);
    content.appendChild(button);
    
    // Create floating dialog
    this.element = this.game.getFloatingUIManager().createDialog({
      id: 'new-dialog',
      title: 'Dialog Title',
      content,
      onClose: () => this.destroy()
    });
  }
}
```

## Game Architecture

### Core Systems

```typescript
// Game instance manages everything
const game = new Game(canvas, mapConfig);

// Key subsystems
game.getCamera();           // Camera system
game.getGrid();            // Grid placement system  
game.getFloatingUIManager(); // UI system
game.getAudioManager();     // Audio system
game.uiController;         // High-level UI control
```

### Entity System

All game objects inherit from `Entity`:

- `Tower`, `Enemy`, `Player`, `Projectile`, `Collectible`
- Common methods: `update()`, `takeDamage()`, `distanceTo()`, `moveTo()`

### Configuration-Driven

All gameplay values live in config files:

- `TowerConfig.ts` - Tower stats
- `EnemyConfig.ts` - Enemy stats  
- `ColorTheme.ts` - Visual theme
- `UIConstants.ts` - UI dimensions
- Never hardcode values - always use configs

## Adding Features

### New Tower Type

1. Add to `TowerType` enum
2. Add config in `TowerConfig.ts`
3. Add icon in `SvgIcons.ts`
4. Write unit tests

### New UI Dialog

1. Create class extending pattern above
2. Add to `UIController`
3. Use element abstractions - NO custom CSS

## Recent Changes (Keep Updated)

1. **UI Refactor (Dec 2024)**: Migrated to utility-first CSS with element abstractions
2. **Removed Systems**: PopupManager, DialogManager, UIManager (use FloatingUIManager)
3. **CSS Cleanup**: Removed 90% of custom CSS classes
4. **TypeScript**: Strict mode enforced, no `any` types allowed
5. **Testing**: Unit tests only, no integration tests
6. **Touch Gestures (Jan 2025)**: Added comprehensive touch gesture system
   - Swipe to pan camera
   - Pinch to zoom
   - Double tap to center on player
   - Gestures disabled during tower placement
   - See `docs/TOUCH_GESTURES.md` for details

## Linear Integration

- **Workspace**: BS Projects
- **Projects**: TD Engine, OctoPrompt
- Use MCP commands: `mcp__linear__list_issues`, `mcp__linear__create_issue`, etc.
- Branch format: `username/td-123-feature-name`

## Performance Guidelines

- Remove destroyed entities from arrays
- Use grid for spatial queries
- Render only visible entities
- Batch DOM updates
- Use `requestAnimationFrame` for animations
