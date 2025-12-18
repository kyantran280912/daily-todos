## Deep Review: Daily Todos Auto-Send System

**Review Date**: 2024-12-18
**Scope**: Full system review
**Files Reviewed**:
- [scripts/send-telegram.ts](scripts/send-telegram.ts)
- [.github/workflows/send-telegram.yml](.github/workflows/send-telegram.yml)
- [.claude/commands/prep-todos.md](.claude/commands/prep-todos.md)
- [package.json](package.json)
- [README.md](README.md)

---

### Requirements Compliance

All core requirements have been implemented:
- Folder structure matches specification
- GitHub Actions workflow with correct cron schedule
- Telegram sending script with proper API integration
- Slash command for todo generation
- Documentation and setup guides

---

### Critical Issues (P0 - Must Fix)

#### 1. Telegram Markdown Parsing Failure

**Severity**: Critical
**File**: [scripts/send-telegram.ts:38-42](scripts/send-telegram.ts#L38-L42)

**Problem**:
Telegram Markdown parser is strict. Content from markdown files contains special characters that will cause parse errors:
- `- [ ]` checkbox syntax contains `[` and `]`
- Underscores `_` in text trigger italic formatting
- Asterisks `*` trigger bold formatting
- Backticks cause code formatting issues

**Impact**: Messages will fail to send, workflow will appear successful but no message delivered.

**Recommendation**: Either escape special characters OR switch to HTML parse mode.

**Code Example**:

```typescript
// BEFORE
body: JSON.stringify({
  chat_id: TELEGRAM_CHAT_ID,
  text,
  parse_mode: 'Markdown',
  disable_web_page_preview: true,
}),

// AFTER - Option 1: Escape markdown
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// AFTER - Option 2: Use HTML (recommended)
body: JSON.stringify({
  chat_id: TELEGRAM_CHAT_ID,
  text: convertToHtml(text),
  parse_mode: 'HTML',
  disable_web_page_preview: true,
}),
```

---

### High Priority Issues

#### 2. Unreliable Timezone Handling

**Severity**: High
**File**: [scripts/send-telegram.ts:12-19](scripts/send-telegram.ts#L12-L19)

**Problem**:
Using `toLocaleString()` with `new Date()` is unreliable:
- Parsing locale string back to Date is implementation-dependent
- May produce incorrect results on some CI environments
- GitHub Actions runners use UTC by default

**Recommendation**: Use `Intl.DateTimeFormat` for reliable formatting.

**Code Example**:

```typescript
// BEFORE
function getVietnamDate(): string {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  // ...
}

// AFTER
function getVietnamDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Returns YYYY-MM-DD
}
```

#### 3. Message Length Limit Not Handled

**Severity**: High
**File**: [scripts/send-telegram.ts:26-58](scripts/send-telegram.ts#L26-L58)

**Problem**:
Telegram has a 4096 character limit per message. Long todo files will fail silently.

**Recommendation**: Split long messages or truncate with warning.

**Code Example**:

```typescript
// AFTER
const MAX_MESSAGE_LENGTH = 4000; // Leave buffer for formatting

async function sendTelegramMessage(text: string): Promise<boolean> {
  if (text.length > MAX_MESSAGE_LENGTH) {
    const truncated = text.substring(0, MAX_MESSAGE_LENGTH);
    const warning = '\n\n_[Message truncated due to length limit]_';
    text = truncated + warning;
  }
  // ... rest of function
}
```

---

### Medium Priority Issues

#### 4. Early Environment Validation Missing

**Severity**: Medium
**File**: [scripts/send-telegram.ts:84-92](scripts/send-telegram.ts#L84-L92)

**Problem**:
Environment variables only checked when sending message. Should fail fast at startup.

**Code Example**:

```typescript
// AFTER - Add at start of main()
async function main(): Promise<void> {
  // Validate env vars immediately
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ Missing required environment variables');
    console.error('   TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? '✓' : '✗');
    console.error('   TELEGRAM_CHAT_ID:', TELEGRAM_CHAT_ID ? '✓' : '✗');
    process.exit(1);
  }

  console.log('🚀 Starting Daily Todos sender...\n');
  // ...
}
```

#### 5. File Reading Error Handling

**Severity**: Medium
**File**: [scripts/send-telegram.ts:75-77](scripts/send-telegram.ts#L75-L77)

**Problem**:
`readFileSync` can throw if file is corrupted or permissions issue.

**Code Example**:

```typescript
// AFTER
for (const project of projects) {
  const todoFile = join(projectsDir, project, `${today}.md`);

  if (existsSync(todoFile)) {
    try {
      const content = readFileSync(todoFile, 'utf-8');
      if (content.trim()) {
        todosMap.set(project, content);
      }
    } catch (error) {
      console.error(`⚠️ Failed to read ${todoFile}:`, error);
    }
  }
}
```

#### 6. Hardcoded Path in Slash Command

**Severity**: Medium
**File**: [.claude/commands/prep-todos.md:32](prep-todos.md#L32)

**Problem**:
Path `~/Documents/Development/Automations/daily-todos` is hardcoded to specific user directory.

**Recommendation**: Use environment variable or make path configurable.

---

### Low Priority Issues

#### 7. Missing packageManager Field

**Severity**: Low
**File**: [package.json](package.json)

**Problem**:
Missing `packageManager` field can cause version mismatch in CI.

**Code Example**:

```json
{
  "name": "daily-todos",
  "packageManager": "pnpm@8.15.0",
  // ...
}
```

#### 8. No Retry Mechanism

**Severity**: Low
**File**: [scripts/send-telegram.ts:34-57](scripts/send-telegram.ts#L34-L57)

**Problem**:
Network failures cause immediate failure without retry.

**Recommendation**: Add simple retry with exponential backoff for production reliability.

#### 9. Workflow Action Version Consistency

**Severity**: Low
**File**: [.github/workflows/send-telegram.yml:18-19](.github/workflows/send-telegram.yml#L18-L19)

**Problem**:
`pnpm/action-setup@v2` uses major version tag while others use v4.

---

### Architecture Notes

**Strengths**:
- Clean separation of concerns
- Simple, focused script
- Good use of native Node.js APIs (no external dependencies for core logic)
- Proper TypeScript configuration

**Areas for Improvement**:
- Consider adding a simple config file for customization
- Logging could be more structured for debugging

---

### Security Notes

**No critical security issues found.**

**Observations**:
- Secrets properly handled via GitHub Actions secrets
- No hardcoded credentials in code
- Bot token exposed in .env file locally (acceptable for personal use)

---

## Fix Plan Summary

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | Telegram Markdown parsing | 30 min |
| P1 | Timezone handling | 15 min |
| P1 | Message length limit | 15 min |
| P2 | Early env validation | 10 min |
| P2 | File reading error handling | 10 min |
| P2 | Hardcoded path in command | 5 min |
| P3 | packageManager field | 2 min |
| P3 | Retry mechanism | 20 min |

**Total estimated effort**: ~2 hours for all fixes

---

## PR/Review Summary

### Code Review Summary

**Review Date**: 2024-12-18
**Risk Level**: Medium

### Critical and High Priority Issues
- [ ] [P0] Telegram Markdown parsing will fail on checkbox syntax - [send-telegram.ts:38-42](scripts/send-telegram.ts#L38-L42)
- [ ] [P1] Timezone handling unreliable in CI - [send-telegram.ts:12-19](scripts/send-telegram.ts#L12-L19)
- [ ] [P1] No message length limit handling - [send-telegram.ts:26-58](scripts/send-telegram.ts#L26-L58)

### Positive Notes
- All requirements implemented correctly
- Clean, readable code structure
- Good error logging with emoji indicators
- Proper rate limiting between messages

**Recommendation**: Fix P0 issue before first deployment. P1 issues should be addressed before production use.
