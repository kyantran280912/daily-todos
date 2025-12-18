Analyze the current project and generate todos for tomorrow.

**Arguments:** $ARGUMENTS

- If `$ARGUMENTS` contains `--send` or `send`: Send to Telegram immediately after creating todos
- Default: Only create todos, no sending

## Instructions

1. **Gather context** from current project:
   - Check for open issues (if GitHub repo): `gh issue list --state open --limit 10`
   - Recent commits (7 days): `git log --oneline --since="7 days ago"`
   - TODO/FIXME comments: search for `TODO:`, `FIXME:`, `HACK:` in code
   - Check for failing tests if test command exists
   - Look at package.json scripts for common tasks

2. **Generate todos** with this format:

```markdown
# Tasks - {project-name}

## Tasks
- Review PR #123 from backend team
- Fix login timeout bug
- Deploy staging environment

## Meetings
- Daily standup 9am
- Sprint review 4pm

## Reminders
- Sync with design team after standup
- Check client email

## Blockers
- Waiting for API docs from backend team

## Notes
- Backend API ready at 2pm

## Deadline
- Complete by 5pm today!
```

**Format rules:**
- Tasks: `- Task description` (no time needed)
- Meetings: `- Meeting name + time`
- Deadline: Single line for all tasks
- Skip section if no content

3. **Save file**:
   - Path: `~/Documents/Development/Automations/daily-todos/projects/{project-name}/{YYYY-MM-DD}.md`
   - Date = **tomorrow** (not today)
   - Create project folder if not exists

4. **Git operations** in daily-todos repo:
   - `cd ~/Documents/Development/Automations/daily-todos`
   - `git add .`
   - `git commit -m "Add todos for {project} - {date}"`
   - `git push`

5. **Confirm** with user:
   - Show todos content
   - Show file path
   - Confirm pushed to GitHub

6. **Send Telegram** (if argument `--send` or `send` provided):
   - Copy created file to today's date (so script can read it)
   - Run: `source ~/Documents/Development/Automations/daily-todos/.env && TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID pnpm --dir ~/Documents/Development/Automations/daily-todos send`
   - Delete temp copy file
   - Confirm sent to Telegram

## Important Notes

- Use current project folder name as project name
- Date format: YYYY-MM-DD (e.g., 2024-01-15)
- Tasks should be specific, actionable
- Each task should be completable in 1 day
- Priority: bugs > features > refactoring
- Deadline should be realistic based on task complexity
