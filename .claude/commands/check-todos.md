---
description: "Review and check todos completion [#id]"
---

Review todos and check completion status.

**Arguments:** $ARGUMENTS

**Usage:**
- `/check-todos #e90e` - Review todos with ID e90e
- `/check-todos e90e` - Also works without #

## Instructions

1. **Parse short ID** from arguments:
   - Extract ID (e.g., `#e90e` or `e90e` → `e90e`)
   - If no ID provided: ask user for ID

2. **Find todos file**:
   - Search in `~/Documents/Development/Automations/daily-todos/projects/*/*-{id}.md`
   - Use glob pattern: `**/*-{id}.md`
   - If not found: inform user and exit

3. **Read todos file**:
   - Parse markdown content
   - Extract all tasks, meetings, reminders, blockers, notes

4. **Review project** (if user is in a project directory):
   - Use Task tool with `subagent_type=Explore` to review codebase
   - Check if tasks are completed:
     - Look for implemented features
     - Check if bugs are fixed
     - Verify files mentioned in tasks exist
   - Identify incomplete tasks
   - Find issues or improvements needed

5. **Generate review report**:
   - ✅ **Completed tasks**: List what's done
   - ⏳ **In progress**: Partially done tasks
   - ❌ **Not started**: Tasks not yet started
   - 💡 **Suggestions**: Improvements or fixes needed
   - 📝 **Additional tasks**: New tasks discovered during review

6. **Ask user** for next action:
   - Update todos file with completion status
   - Add new tasks to existing file
   - Create new todos file for additional work
   - Mark file as completed

## Review checklist

When reviewing project against todos:
- Check if files mentioned exist and contain expected changes
- Verify bug fixes actually resolve the issues
- Look for incomplete implementations
- Check code quality and potential improvements
- Identify missing tests or documentation

## Output format

```markdown
## 📊 Todos Review: {project-name} #{id}

**File:** {path to todos file}
**Date:** {date from filename}

### ✅ Completed (X/Y tasks)
- Task 1 - Verified in {file path}
- Task 2 - Implemented

### ⏳ In Progress (X tasks)
- Task 3 - Partially done, missing {detail}

### ❌ Not Started (X tasks)
- Task 4
- Task 5

### 💡 Suggestions
- Issue found: {description}
- Improvement: {suggestion}

### 📝 Additional Tasks Found
- New task 1
- New task 2
```

## Important notes

- Use Explore agent to understand codebase deeply
- Be specific about what's completed vs incomplete
- Provide file paths and line numbers when referencing code
- Suggest concrete next steps
- If not in project directory, skip code review and just show todos
