Analyze the current project and generate todos for tomorrow.

## Instructions

1. **Gather context** từ project hiện tại:
   - Check for open issues (if GitHub repo): `gh issue list --state open --limit 10`
   - Recent commits (7 days): `git log --oneline --since="7 days ago"`
   - TODO/FIXME comments: search for `TODO:`, `FIXME:`, `HACK:` in code
   - Check for failing tests if test command exists
   - Look at package.json scripts for common tasks

2. **Generate todos** với format sau:

```markdown
# Tasks - {project-name}

## Tasks
- Review PR #123 từ team backend
- Fix bug login timeout
- Deploy staging environment

## Meetings
- Daily standup 9am
- Sprint review 4pm

## Reminders
- Sync với team design sau standup
- Check email từ client

## Blockers
- Waiting for API docs từ backend team

## Notes
- Backend API ready lúc 2pm

## Deadline
- Cần xong trước 5pm nhé
```

**Format rules:**
- Tasks: `- Task description` (không cần giờ)
- Meetings: `- Meeting name + time`
- Deadline: 1 dòng chung cho tất cả tasks
- Bỏ section nếu không có nội dung

3. **Save file**:
   - Path: `~/Documents/Development/Automations/daily-todos/projects/{project-name}/{YYYY-MM-DD}.md`
   - Date = **tomorrow** (not today)
   - Create project folder if not exists

4. **Git operations** trong daily-todos repo:
   - `cd ~/Documents/Development/Automations/daily-todos`
   - `git add .`
   - `git commit -m "Add todos for {project} - {date}"`
   - `git push`

5. **Confirm** với user:
   - Hiển thị nội dung todos đã tạo
   - Show đường dẫn file
   - Confirm đã push lên GitHub

## Important Notes

- Dùng tên folder của project hiện tại làm project name
- Date format: YYYY-MM-DD (e.g., 2024-01-15)
- Tasks nên specific, actionable
- Mỗi task nên hoàn thành được trong 1 ngày
- Ưu tiên: bugs > features > refactoring
- Deadline realistic, dựa trên complexity của task
