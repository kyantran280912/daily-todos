# Daily Todos Auto-Send System

Hệ thống tự động gửi todos qua Telegram mỗi sáng.

## Flow

1. **Tối hôm trước**: Dùng `/prep-todos` trong Claude Code để generate todos
2. **6:00 AM**: GitHub Actions tự động đọc file và gửi qua Telegram

## Setup

### 1. Tạo Telegram Bot

1. Chat với [@BotFather](https://t.me/BotFather) trên Telegram
2. Gửi `/newbot` và làm theo hướng dẫn
3. Copy **Bot Token** (format: `123456789:ABC...`)

### 2. Lấy Chat ID

**Cách 1: Bot API**
1. Gửi tin nhắn bất kỳ cho bot của bạn
2. Truy cập: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Tìm `"chat":{"id": 123456789}` → đó là Chat ID

**Cách 2: @userinfobot**
1. Chat với [@userinfobot](https://t.me/userinfobot)
2. Bot sẽ trả về Chat ID của bạn

### 3. Setup GitHub Secrets

1. Vào repo → Settings → Secrets and variables → Actions
2. Thêm 2 secrets:
   - `TELEGRAM_BOT_TOKEN`: Bot token từ BotFather
   - `TELEGRAM_CHAT_ID`: Chat ID của bạn

### 4. Cài đặt local (optional)

```bash
pnpm install

# Test gửi message
cp .env.example .env
# Edit .env với token và chat ID thật
pnpm send
```

## Usage

### Tạo todos cho ngày mai

Trong bất kỳ project nào có Claude Code:

```bash
claude
# Gõ: /prep-todos
```

Claude sẽ:
1. Phân tích project (issues, commits, TODOs...)
2. Generate todos file
3. Commit và push lên repo này

### Cấu trúc file todos

```
projects/
├── my-app/
│   ├── 2024-01-15.md
│   └── 2024-01-16.md
└── another-project/
    └── 2024-01-15.md
```

### Format todos

```markdown
# Todos for my-app

## 🎯 Priority (phải làm)
- [ ] Fix login bug

## 📝 Should do (nên làm)
- [ ] Add unit tests

## 💡 Nice to have
- [ ] Refactor utils

## 📌 Notes
- Waiting for API docs from backend team
```

## Manual Trigger

Nếu cần gửi ngay (không đợi cron):

1. Vào repo → Actions → Send Daily Todos
2. Click "Run workflow"

## Timezone

- Cron chạy lúc **6:00 AM Vietnam time** (UTC+7)
- File todos được đặt tên theo ngày Vietnam

## Troubleshooting

**Bot không gửi được message?**
- Kiểm tra token và chat ID đúng chưa
- Đảm bảo đã chat với bot ít nhất 1 lần trước

**Workflow không chạy?**
- Check secrets đã được set chưa
- Xem logs trong Actions tab

**Không thấy todos?**
- Kiểm tra file có đúng format `YYYY-MM-DD.md` không
- Đảm bảo file nằm trong `projects/{project-name}/`
