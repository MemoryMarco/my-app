# 留声 · 精致留言板 (LiúShēng)
[cloudflarebutton]
留声 (LiúShēng) 是一个极致视觉与交互��验并重的留言板 Web 应用。用户使用手机验证码（OTP）登录，登录后可发布留言、回复、点赞；留言���存储到 Cloudflare Durable Object，并在配置的收件邮箱上按「工作日（周一到五）每��� 20:00」以一天一封的形式汇总发送。
该应用采用极简设计（Minimalist Design），主色系为暖橙（RGB 243,128,32）、暗灰（56,65,84）和靛蓝（99,102,241），注重首屏视觉���击力和流畅交互。移动优先，完美响应式布局。
## 关键特性
- **手机 OTP 登录**：安全便捷的验证码登录，支持演示模式和生产模式。
- **留言、回复与点赞**：用户登录后可发布文本留言，在留言下进行多层级回复（最多 3 层），并对任意留言或回复进行点赞。
- **邮件汇总发送**：工作日 20:00 自动汇总当天新留言、回复和点赞数，发送到配置邮箱。
- **配置管理**：站点级邮箱设置面板，支持 provider 类型（mock/http）、API 密钥和手动触发发送。
- **视觉与交互精致**：使用 shadcn/ui 组件，Tailwind 渐变背景、���载骨架屏、空状态插画、Toast 反馈，确保用户体验流畅。
- **持久化存储**：基于 Cloudflare Durable Objects 的实体存储，支持高效列表查询。
- **安全与扩展**：OTP 防��限流、邮件提供商适配、时区配置、生产密钥管理（Worker Secrets）。
## 技术栈
- **前端**：React 18 + React Router 6 + TypeScript + shadcn/ui + Tailwind CSS 3 + Lucide React + Framer Motion + Sonner + React Hook Form + Zod + Immer。
- **后端**：Hono + Cloudflare Workers + Durable Objects。
- **构建与部署**：Vite + Bun + Wrangler。
## 快速开始
### 先决条件
- Bun 1.0+
- Cloudflare 账户
### 安装与开发
1.  克隆仓库并安装依赖：
    ```bash
    git clone <your-repo-url>
    cd liuyan-studio
    bun install
    ```
2.  启动开发服务器：
    ```bash
    bun run dev
    ```
    访问 `http://localhost:3000`。前端会自动代理 `/api/*` 请求到本地 Worker 模拟器。
### 构建与部署
```bash
# 构建生产版本
bun run build
# 部署到 Cloudflare
wrangler deploy
```
## 使用指南
### 新功能：回复与点赞
- **回复**：在每条留言卡片下方点击“回复”按钮，即可展开输入框进行回复。回复会以缩进的形式嵌套在父留言/回复下方，���多支持 3 层嵌套。
- **点赞**：点击心形图标可对任意留言或回复点赞。图标会实���更新状态和总点赞数。
### API 端点 (`/api/*`)
- `POST /api/replies`：创建回复（body: `{ parentId, text, messageId }`）。
- `PUT /api/likes/:targetId?type=<message|reply>`：切换点赞状态。
- 其他端点�� `worker/user-routes.ts`。
## 迁移到 Spring Boot + Vue.js
本节为将当前 Cloudflare Workers 应用迁移到传统的全栈分离架构（Java Spring Boot + Vue.js）的指南。
### 1. 后端迁移 (Spring Boot)
#### 1.1. 项目设置
使用 [Spring Initializr](https://start.spring.io/) 创建新项目，包含以下依赖：
- Spring Web
- Spring Data JPA
- Spring Security
- H2 Database (用于本地开发) / PostgreSQL Driver (用于生产)
- Quartz Scheduler (用于定时任务)
#### 1.2. 数据模型 (JPA Entities)
为 `Message`, `Reply`, `Like`, `Settings` 创建 JPA `@Entity` 类。
- **Message**: `@OneToMany` 关联 `Reply` 和 `Like`。
- **Reply**: `@ManyToOne` 关联 `Message` 和父 `Reply` (自引用)，实现嵌套。
- **Like**: `@ManyToOne` 关联 `Message` 或 `Reply` (使用 `@Any` 或两个独立关联)。
#### 1.3. REST API (`@RestController`)
创建 Controller 映射 `/api/*` 端点：
- `AuthController`: 处理 OTP 请求和验证，使用 Spring Security 和 JWT 实现会话管理。
- `MessageController`: 实现留言的 CRUD，回复的创建，以及点赞的切换。
- `SettingsController`: 管理邮箱配置。
- `EmailController`: ���含手动触发邮件发送的端点。
#### 1.4. 定时任务 (Quartz)
创建一个 Quartz Job，使用 Cron 表达式 `0 0 20 ? * MON-FRI` 来触发 `send-weekly` 逻辑。该任务会查询自上次发送以来的新留言、回复和点赞，并使用 `JavaMailSender` 或第三方邮件服务 API 发送邮件。
#### 1.5. 安全与配置
- 使用 Spring Security 配置 JWT 过滤器，保护需要认证的端点。
- 在 `application.properties` 中配置数据库连接、邮件服务凭证等，生产环境中使用环境变量。
### 2. 前端迁移 (Vue.js)
#### 2.1. 项目设置
使用 Vite 或 Nuxt.js 创建新的 Vue 3 项目。
```bash
# Vite
npm create vue@latest
# Nuxt 3
npx nuxi@latest init <project-name>
```
安装 Pinia (状态管理), Axios (HTTP 请求), 和一个 UI 库 (如 Vuetify 或 Element Plus)。
#### 2.2. 组件化
将���有 React 组件重构为 Vue 单文件组件 (`.vue`)：
- `MessageCard.vue`: 使用递归组件 (`<MessageCard :message="reply" ... />`) 来渲染嵌套回复。
- `LikeButton.vue`: 封装点赞按钮的逻辑和动画。
- `AuthSheet.vue`: 实现 OTP 登录流程。
#### 2.3. 状态管理 (Pinia)
创建一个 `auth` store 来管理用户登录状态和 token，一个 `messages` store 来管理留言列表和与 API 的交互（���括乐观更新）。
#### 2.4. API 通信 (Axios)
创建一个 Axios 实例，并使用拦截���自动在请求头中附加 `Authorization: Bearer <token>`。
### 3. 部署
- **后端 (Spring Boot)**: 打包成 JAR 文件，通过 Docker 容器化，部署到 Heroku, Railway, 或任何支持 Java 的云平台。通过环境变量配置数据库和 API 密钥。
- **前端 (Vue.js)**: 构建静态���件，部署到 Vercel, Netlify, 或 Cloudflare Pages。配置反��代理，将 `/api` 请求转发到后端服务的地址。
### 4. 数据迁移
编写一个一次性脚本，从 Cloudflare Durable Objects 中导出数据，并将其导入到新的 PostgreSQL 数据库中。
## 许可��
MIT License。