import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MAX_MESSAGE_LENGTH = 4000;

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

interface ParsedTodos {
  title: string;
  tasks: string[];
  meetings: string[];
  reminders: string[];
  blockers: string[];
  notes: string[];
  deadline: string[];
}

function getVietnamDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

type SectionKey = 'tasks' | 'meetings' | 'reminders' | 'blockers' | 'notes' | 'deadline';

function parseTodoFile(content: string): ParsedTodos {
  const lines = content.split('\n');
  const result: ParsedTodos = {
    title: '',
    tasks: [],
    meetings: [],
    reminders: [],
    blockers: [],
    notes: [],
    deadline: [],
  };

  let currentSection: SectionKey | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse title: # Tasks - project-name
    if (trimmed.startsWith('# ')) {
      result.title = trimmed.replace(/^#\s*/, '');
      continue;
    }

    // Parse section headers
    if (trimmed.startsWith('## ')) {
      const section = trimmed.replace(/^##\s*/, '').toLowerCase();
      if (section.includes('task')) currentSection = 'tasks';
      else if (section.includes('meeting')) currentSection = 'meetings';
      else if (section.includes('reminder')) currentSection = 'reminders';
      else if (section.includes('blocker')) currentSection = 'blockers';
      else if (section.includes('note')) currentSection = 'notes';
      else if (section.includes('deadline')) currentSection = 'deadline';
      else currentSection = null;
      continue;
    }

    // Parse list items
    if (trimmed.startsWith('- ') && currentSection) {
      const item = trimmed.replace(/^-\s*/, '');
      if (item) {
        result[currentSection].push(item);
      }
    }
  }

  return result;
}

function formatTaskItem(item: string, index: number): string {
  return `${index + 1}. ${escapeHtml(item)}`;
}

function formatMeetingItem(item: string): string {
  return `• ${escapeHtml(item)}`;
}

function formatListItem(item: string): string {
  return `• ${escapeHtml(item)}`;
}

function buildMessage(
  project: string,
  date: string,
  todos: ParsedTodos,
  shortIds: string[] = []
): string {
  const sections: string[] = [];

  // Header
  sections.push(`📋 <b>Tasks hôm nay</b>`);
  sections.push(`🏷️ Project: <b>${escapeHtml(project)}</b>`);
  sections.push(`📅 ${date}`);
  sections.push('');
  sections.push('━━━━━━━━━━━━━━━━━━━━');

  // Tasks
  if (todos.tasks.length > 0) {
    sections.push('');
    sections.push('📌 <b>Tasks:</b>');
    todos.tasks.forEach((task, i) => {
      sections.push(formatTaskItem(task, i));
    });
  }

  // Meetings
  if (todos.meetings.length > 0) {
    sections.push('');
    sections.push('📅 <b>Meetings:</b>');
    todos.meetings.forEach((meeting) => {
      sections.push(formatMeetingItem(meeting));
    });
  }

  // Reminders
  if (todos.reminders.length > 0) {
    sections.push('');
    sections.push('🔔 <b>Reminders:</b>');
    todos.reminders.forEach((reminder) => {
      sections.push(formatListItem(reminder));
    });
  }

  // Blockers
  if (todos.blockers.length > 0) {
    sections.push('');
    sections.push('⚠️ <b>Blockers:</b>');
    todos.blockers.forEach((blocker) => {
      sections.push(formatListItem(blocker));
    });
  }

  // Notes
  if (todos.notes.length > 0) {
    sections.push('');
    sections.push('📝 <b>Notes:</b>');
    todos.notes.forEach((note) => {
      sections.push(formatListItem(note));
    });
  }

  // Footer
  sections.push('');
  sections.push('━━━━━━━━━━━━━━━━━━━━');

  // Deadline / CTA
  if (todos.deadline.length > 0) {
    sections.push('');
    sections.push(`⏰ ${escapeHtml(todos.deadline[0])}`);
  } else {
    sections.push('');
    sections.push('💪 Good luck!');
  }

  // Short IDs for /check-todos
  if (shortIds.length > 0) {
    sections.push('');
    const ids = shortIds.map((id) => `<code>#${id}</code>`).join(' ');
    sections.push(`📎 Review: /check-todos ${ids}`);
  }

  return sections.join('\n');
}

function truncateMessage(text: string): string {
  if (text.length <= MAX_MESSAGE_LENGTH) {
    return text;
  }

  const truncated = text.substring(0, MAX_MESSAGE_LENGTH - 50);
  return truncated + '\n\n<i>[Truncated - message too long]</i>';
}

async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    process.exit(1);
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const finalText = truncateMessage(text);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: finalText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = (await response.json()) as TelegramResponse;

    if (!data.ok) {
      console.error('❌ Telegram API error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    return false;
  }
}

interface TodoFiles {
  files: string[];
  contents: string[];
}

function findTodosForToday(
  projectsDir: string,
  today: string
): Map<string, TodoFiles> {
  const todosMap = new Map<string, TodoFiles>();

  if (!existsSync(projectsDir)) {
    console.log('📁 Projects directory not found');
    return todosMap;
  }

  const projects = readdirSync(projectsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const project of projects) {
    const projectDir = join(projectsDir, project);
    const files = readdirSync(projectDir)
      .filter((file) => file.startsWith(today) && file.endsWith('.md'))
      .sort();

    if (files.length > 0) {
      const contents: string[] = [];
      const fileNames: string[] = [];

      for (const file of files) {
        try {
          const content = readFileSync(join(projectDir, file), 'utf-8');
          if (content.trim()) {
            contents.push(content);
            fileNames.push(file);
          }
        } catch (error) {
          console.error(`⚠️ Failed to read ${file}:`, error);
        }
      }
      if (contents.length > 0) {
        todosMap.set(project, { files: fileNames, contents });
      }
    }
  }

  return todosMap;
}

async function main(): Promise<void> {
  // Early validation
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? '✓' : '✗');
    console.error('   TELEGRAM_CHAT_ID:', TELEGRAM_CHAT_ID ? '✓' : '✗');
    process.exit(1);
  }

  console.log('🚀 Starting Daily Todos sender...\n');

  const today = getVietnamDate();
  const formattedDate = formatDate(today);
  console.log(`📅 Today (Vietnam): ${formattedDate}\n`);

  const projectsDir = join(process.cwd(), 'projects');
  const todos = findTodosForToday(projectsDir, today);

  if (todos.size === 0) {
    console.log('📭 No todos found for today');

    const message = `📋 <b>Daily Task Report</b>
━━━━━━━━━━━━━━━━━━━━

📅 ${formattedDate}

Không có tasks nào cho hôm nay.

💡 Dùng <code>/prep-todos</code> để tạo tasks cho ngày mai.

━━━━━━━━━━━━━━━━━━━━`;

    const success = await sendTelegramMessage(message);
    if (success) {
      console.log('✅ Reminder sent successfully');
    }
    return;
  }

  console.log(`📋 Found todos for ${todos.size} project(s):\n`);

  for (const [project, todoFiles] of todos) {
    console.log(`  → ${project} (${todoFiles.files.length} file(s))`);

    // Extract short IDs from filenames (e.g., "2025-12-19-e90e.md" → "e90e")
    const shortIds = todoFiles.files.map((filename) => {
      const match = filename.match(/-([a-z0-9]+)\.md$/);
      return match ? match[1] : '';
    }).filter(Boolean);

    // Merge todos from all files
    const mergedTodos: ParsedTodos = {
      title: '',
      tasks: [],
      meetings: [],
      reminders: [],
      blockers: [],
      notes: [],
      deadline: [],
    };

    for (const content of todoFiles.contents) {
      const parsed = parseTodoFile(content);
      if (!mergedTodos.title && parsed.title) {
        mergedTodos.title = parsed.title;
      }
      mergedTodos.tasks.push(...parsed.tasks);
      mergedTodos.meetings.push(...parsed.meetings);
      mergedTodos.reminders.push(...parsed.reminders);
      mergedTodos.blockers.push(...parsed.blockers);
      mergedTodos.notes.push(...parsed.notes);
      if (parsed.deadline.length > 0 && mergedTodos.deadline.length === 0) {
        mergedTodos.deadline = parsed.deadline;
      }
    }

    const message = buildMessage(project, formattedDate, mergedTodos, shortIds);

    const success = await sendTelegramMessage(message);

    if (success) {
      console.log(`  ✅ Sent todos for ${project}`);
    } else {
      console.log(`  ❌ Failed to send todos for ${project}`);
    }

    // Small delay between messages to avoid rate limiting
    if (todos.size > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log('\n🎉 Done!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
