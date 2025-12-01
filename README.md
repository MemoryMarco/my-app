# 留声 · 精致留言板 (LiúShēng)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MemoryMarco/my-app)
留声 (LiúShēng) 是一个极致视觉与交互��验并重的留言板 Web 应用。用户使用手机验证码（OTP）登录，登录后可发布留言、回复、点赞��留言会存储到 Cloudflare Durable Object，并在配置的收件邮箱上按「工作日（周一到五）每天 20:00」以一天一封的形式汇总发送。
该应用采用极简设计（Minimalist Design），主色系为暖橙（RGB 243,128,32）、暗灰（56,65,84）和靛蓝（99,102,241），注重首屏视觉冲击力和流畅交互。移动优先，完美响应式布局。
## 关键特性
- **手机 OTP 登录**：安全便捷的验证码登录，支持演示模式和生产模式。
- **留言、回复与点赞**：用户登录后可发布文本留言，在留言下进行多层级回复（最多 3 层），并对任意留言或回复进行点赞。
- **邮件汇总发送**：工作日 20:00 自动汇总当天新留言、回复和点赞数，发送到配置邮箱。
- **配置管理**：站点级邮箱设置面板，支持 provider 类型（mock/http）、API 密钥和手动触发发送。
- **视觉与交互精致**：使用 shadcn/ui 组件，Tailwind 渐变背景、���载骨架屏、空状态插画、Toast 反馈，确保用户体验流畅。
- **持久化存储**：基于 Cloudflare Durable Objects 的实体存储，支持高效列表查询。
- **安全与扩展**：OTP 防刷���流、邮件提供商适配、时区配置、生产密钥管理（Worker Secrets）。
## 技���栈
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
## 迁移到 Spring Boot + Vue.js
本节为将当前 Cloudflare Workers 应用迁移到传统的��栈分离架构（Java Spring Boot + Vue.js）的指南。该迁移后的代码位于 `/migration` 目录中。
### 1. 后端迁移 (Spring Boot)
#### 1.1. 项目设置
后端代码位于 `migration/backend`。它是一个使用 Maven 构建的 Spring Boot 项目。
- **依赖**: Spring Web, Spring Data JPA, Spring Security, Quartz, H2 (开发), PostgreSQL (生产), JJWT, Lombok. 详��信息请查看 `migration/backend/pom.xml`。
- **运行**:
  ```bash
  # 进入后端目录
  cd migration/backend
  # 使用 Maven Wrapper 运行 (推荐)
  ./mvnw spring-boot:run
  ```
  后端服务将在 `http://localhost:8080` 启动。
#### 1.2. 测试
- **OTP 登录**: 使用 Postman 或 cURL, `POST` 到 `http://localhost:8080/api/auth/request-otp` with body `{"phone": "12345678901"}`. 然后使用返回的 `demoCode` `POST` 到 `/api/auth/verify-otp`.
- **发布留言**: `POST` 到 `http://localhost:8080/api/messages` with `Authorization: Bearer <token>` and body `{"text": "My first message!"}`.
### 2. 前端迁移 (Vue.js)
#### 2.1. 项目设置
前端代码位于 `migration/frontend-vue`。它是一个使用 Vite 构建的 Vue 3 项目。
- **运行**:
  ```bash
  # 进入���端目录
  cd migration/frontend-vue
  # 安装依赖
  bun install
  # 启动开发服务器
  bun run dev
  ```
  前端应用将在 `http://localhost:5173` (或 Vite 指定的其他端口) 启动，并自动代理 `/api` 请求到 `http://localhost:8080` 的后端服务。
### 3. 部署
- **后端 (Spring Boot)**:
  1.  构建 JAR 文件: `cd migration/backend && ./mvnw clean package`
  2.  将生成的 JAR 文件 (`target/liuyan-backend-1.0.0.jar`) 部署到支持 Java 的平台，如 Heroku 或 Railway。
  3.  在部署平台设置环境变量:
      - `DB_URL`: 生产 PostgreSQL 数据库的 JDBC URL.
      - `DB_USER`: 数据库用户名.
      - `DB_PASS`: 数据库密码.
      - `JWT_SECRET`: 用于签发 JWT 的长而安全的密钥.
- **前端 (Vue.js)**:
  1.  构建静态文件: `cd migration/frontend-vue && bun run build`
  2.  将 `dist` 目录下的内容部署到静态托管平台，如 Vercel, Netlify, 或 Cloudflare Pages。
  3.  在托管平台配置反向代理，将所有 `/api/*` 请求转发到您后端服务的 URL。
### 4. 数据迁移 (可选)
要将数据从 Cloudflare Durable Objects 迁移到 PostgreSQL，需要编写一个一次性脚本。
1.  **导出**: 创建一个临时的 Worker 端�� `/api/migrate/export`，该端点读取所有 `MessageEntity`, `ReplyEntity`, `LikeEntity` 数据并以 JSON 格式返回。
2.  **导入**: 编写一个本地脚本（例如，使用 Java 或 Node.js），该脚本调用 `/api/migrate/export` 端点，获取数据，然后使用 JPA/JDBC 将数据批量插入到 PostgreSQL 数据库中。
## 许可证
MIT License。