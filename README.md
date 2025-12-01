# 留声 · 精致留言板 (LiúShēng)

[cloudflarebutton]

留声 (LiúShēng) 是一个极致视觉与交互体验并重的留言板 Web 应用。用户使用手机验证码（OTP）登录，登录后可发布留言；留言会存储到 Cloudflare Durable Object，并在配置的收件邮箱上按「工作日（周一到周五）每天 20:00」以一天一封的形式汇总发送。初版提供手动触发 `/api/send-weekly` 端点，生产环境可通过 Cloudflare Cron Trigger 或第三方任务调度器定时调用。

该应用采用极简设计（Minimalist Design），主色系为暖橙（RGB 243,128,32）、暗灰（56,65,84）和靛蓝（99,102,241），注重首屏视觉冲击力和流畅交互。移动优先，完美响应式布局。

## 关键特性

- **手机 OTP 登录**：安全便捷的验证码登录，支持演示模式（前端显示验证码）和生产模式（集成真实 SMS 提供商）。
- **留言发布与列表**：用户登录后可发布文本留言，实时显示在精美卡片列表中，支持微交互（如 hover 提升、动画）。
- **邮件汇总发送**：工作日 20:00 自动汇总当天留言发送到配置邮箱（支持 mock 测试和真实提供商如 SendGrid、Mailgun）。
- **配置管理**：站点级邮箱设置面板，支持 provider 类型（mock/http）、API 密钥（后端安全存储）和手动触发发送。
- **视觉与交互精致**：使用 shadcn/ui 组件，Tailwind 渐变背景、加载骨架屏、空状态插画、Toast 反馈，确保用户体验流畅。
- **持久化存储**：基于 Cloudflare Durable Objects 的实体存储（MessageEntity、SettingsEntity、AuthEntity），支持 IndexedEntity 高效列表查询。
- **安全与扩展**：OTP 防刷限流、邮件提供商适配、时区配置、生产密钥管理（Worker Secrets）。

## 技术栈

- **前端**：React 18 + React Router 6 + TypeScript + shadcn/ui + Tailwind CSS 3 + Lucide React（图标） + Framer Motion（动画） + Sonner（Toast） + React Hook Form + Zod（验证） + Input-OTP（验证码输入） + Zustand（状态管理） + Date-fns（日期格式）。
- **后端**：Hono（路由） + Cloudflare Workers + Durable Objects（持久化） + Entities 模式（IndexedEntity）。
- **构建与部署**：Vite（开发） + Bun（包管理） + Wrangler（Cloudflare 部署）。
- **其他**：Immer（不可变状态） + @tanstack/react-query（可选数据缓存）。

## 快速开始

### 先决条件

- Bun 1.0+（推荐使用 Bun 作为包管理器）。
- Node.js 18+（可选，用于某些工具）。
- Cloudflare 账户（用于部署）。

### 安装

1. 克隆仓库：
   ```
   git clone <your-repo-url>
   cd liuyan-studio
   ```

2. 安装依赖（使用 Bun）：
   ```
   bun install
   ```

3. 生成 Cloudflare Worker 类型定义：
   ```
   bun run cf-typegen
   ```

### 开发模式

1. 启动前端开发服务器：
   ```
   bun run dev
   ```
   访问 `http://localhost:3000`（默认端口，可通过环境变量 `PORT` 修改）。

2. （可选）启动 Worker 开发（Pages 模式）：
   ```
   bun run dev:worker
   ```
   这将启动本地 Worker 模拟器，支持 API 测试。

前端会自动代理 `/api/*` 请求到 Worker。演示环境中，OTP 验证码将直接在前端显示（仅用于测试）；生产需替换为真实 SMS 服务。

### 构建

构建生产版本：
```
bun run build
```

## 使用指南

### 用户流程

1. **访问首页**：显示 Hero 渐变背景、登录 CTA 和空留言列表（带骨架屏）。
2. **OTP 登录**：
   - 点击登录按钮，打开底部 Sheet。
   - 输入手机号，点击“发送验证码”（演示模式显示 6 位码）。
   - 输入验证码验证，成功后关闭 Sheet 并显示留言面板。
3. **发布留言**：登录后在 Textarea 输入文本，点击发送按钮（乐观更新 + Toast 反馈）。
4. **查看留言**：列表以卡片形式显示（用户名/手机号遮掩、时间戳、hover 动画）。
5. **管理员设置**（右上角入口）：
   - 配置收件邮箱、provider（mock 或 http）。
   - 点击“立即发送”手动触发 `/api/send-weekly` 测试。
   - 查看发送记录（最近 5 次）和上次发送时间。

### API 端点（`/api/*`）

- `POST /api/auth/request-otp`：请求 OTP（body: `{ phone: string }`）。
- `POST /api/auth/verify-otp`：验证 OTP 并返回 session token（body: `{ phone: string, code: string }`）。
- `GET /api/messages`：获取留言列表（带 Authorization: Bearer <token>）。
- `POST /api/messages`：创建留言（body: `{ text: string }`，需 token）。
- `GET /api/settings/email`：获取邮箱配置。
- `POST /api/settings/email`：保存配置（body: `{ email: string, provider: 'mock'|'http', apiUrl?: string, apiKey?: string, timezone?: string }`）。
- `POST /api/send-weekly`：手动/定时发送汇总（管理员专用）。

所有 API 返回 `{ success: boolean, data?: T, error?: string }` 格式。

### 配置

- **时区**：默认 UTC，在 Settings 面板配置（影响 20:00 发送时间）。
- **邮件 Provider**：Mock 模式仅记录日志；HTTP 模式通过 fetch 调用外部 API（例如 SendGrid：`POST ${apiUrl}` with `{ to: email, subject: '每日留言', html: template }`）。
- **生产密钥**：API 密钥存为 Worker Secret：
  ```
  wrangler secret put SMS_API_KEY
  wrangler secret put EMAIL_API_KEY
  ```
  在 SettingsEntity 中加密存储非敏感配置。

## 部署

### Cloudflare Workers 部署

1. 登录 Cloudflare Dashboard，创建新 Worker 项目。
2. 安装 Wrangler CLI（如果未安装）：
   ```
   bun add -g wrangler
   wrangler auth login
   ```

3. 配置绑定（wrangler.jsonc 已预设 GlobalDurableObject）：
   ```
   wrangler deploy
   ```

4. （可选）设置 Cron Trigger（生产定时发送）：
   - 在 Dashboard > Triggers > Cron Triggers 添加：
     - 表达式：`0 20 * * 1-5`（周一至周五 20:00 UTC）。
     - 目标：`/api/send-weekly`（POST）。

5. 自定义域名：绑定到 Workers 域名或自定义域名。

[cloudflarebutton]

### 生产集成

- **SMS Provider**：替换 OTP 逻辑为真实服务（如 Twilio、阿里云 SMS），使用 Worker Secret 存储密钥。
- **Rate Limiting**：在 `/api/auth/request-otp` 添加限流（每手机号 60s 一次）。
- **邮件适配**：在 `worker/user-routes.ts` 的 send-weekly 实现 provider-specific payload（例如 SendGrid JSON）。
- **监控**：启用 Cloudflare Observability，添加日志（Pino 已集成）。

构建后，静态资源通过 Assets 托管，前端 SPA 模式处理路由。

## 开发贡献

1. 分支开发：`git checkout -b feature/your-feature`。
2. 代码风格：遵循 ESLint + Prettier（`bun run lint` 检查）。
3. 测试：手动测试 API（Postman）和 UI（Chrome DevTools 移动模拟）。
4. 提交：`git commit -m "feat: add OTP login"`，遵循 Conventional Commits。
5. PR：针对 main 分支，包含变更描述。

问题或贡献欢迎提交 Issue 或 Pull Request。

## 许可证

MIT License。