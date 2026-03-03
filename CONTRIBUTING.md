# 贡献者技能指南

欢迎参与 **liunnn1994.github.io** 的开发和维护！本指南详细说明了不同类型贡献所需的技术技能，无论你是想修复一个 Bug、添加新功能、优化样式，还是撰写一篇新博文，都能在这里找到对应的指引。

完整的技术栈分析请参阅 [TECHNOLOGY.md](./TECHNOLOGY.md)。

---

## 目录

1. [开发环境搭建](#一开发环境搭建)
2. [撰写或编辑博文](#二撰写或编辑博文)
3. [修改页面布局与路由](#三修改页面布局与路由)
4. [修改或新增 UI 组件](#四修改或新增-ui-组件)
5. [修改样式与主题](#五修改样式与主题)
6. [工具函数与全局配置](#六工具函数与全局配置)
7. [OG 图片模板](#七og-图片模板)
8. [构建、工具链与 CI](#八构建工具链与-ci)
9. [代码规范](#九代码规范)
10. [技能速查表](#十技能速查表)
11. [获取帮助](#十一获取帮助)

---

## 一、开发环境搭建

### 前置依赖

| 工具 | 版本要求 | 说明 |
|---|---|---|
| [Node.js](https://nodejs.org) | LTS（推荐 v20+） | JavaScript 运行时 |
| [pnpm](https://pnpm.io) | v9+ | 包管理器（本项目不使用 npm / yarn） |
| [Git](https://git-scm.com) | 任意版本 | 版本控制 |
| [VS Code](https://code.visualstudio.com)（推荐） | 任意版本 | 编辑器，`.vscode/extensions.json` 中有推荐扩展 |

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/liunnn1994/liunnn1994.github.io.git
cd liunnn1994.github.io

# 2. 安装 pnpm（如未安装）
npm install -g pnpm
# 或者通过 corepack 安装（推荐）：
corepack enable && corepack prepare pnpm@latest --activate

# 3. 安装项目依赖（严格按 pnpm-lock.yaml 安装）
pnpm install

# 4. 启动开发服务器（监听所有网络接口，可用于局域网调试）
pnpm dev
# 开发服务器默认地址：http://localhost:4321
```

### 常用脚本

```bash
pnpm dev            # 启动开发服务器（热重载，修改即生效）
pnpm build          # 完整构建：类型检查 → astro build → 生成 Pagefind 搜索索引 → 复制索引
pnpm preview        # 在本地预览生产构建结果（模拟生产环境）
pnpm sync           # 同步 Astro 自动生成的类型定义（.astro/types.d.ts）
pnpm lint           # 运行 ESLint 代码检查
pnpm format         # 用 Prettier 自动格式化所有文件
pnpm format:check   # 用 Prettier 检查格式问题（不修改文件，适用于 CI）
```

### VS Code 推荐扩展

首次打开项目时，VS Code 会弹出提示安装推荐扩展（来自 `.vscode/extensions.json`），建议全部安装：

- **Astro**（`astro-build.astro-vscode`）：Astro 文件语法高亮、智能提示、格式化
- **Tailwind CSS IntelliSense**：Tailwind 工具类自动补全和预览
- **Prettier**：保存时自动格式化
- **ESLint**：实时显示 lint 错误

### Docker 快速启动（可选）

如果不想在本机安装 Node.js 环境，可以通过 Docker 启动：

```bash
# 构建并启动容器，访问 http://localhost:80
docker compose up --build

# 后台运行
docker compose up --build -d

# 停止容器
docker compose down
```

---

## 二、撰写或编辑博文

这是最常见的贡献类型。博文存放于 `src/data/blog/` 目录，支持 **Markdown**（`.md`）和 **MDX**（`.mdx`）两种格式。

### 所需技能

- Markdown 基础语法（标题、列表、链接、代码块、图片、表格、引用）
- YAML front-matter 字段的含义和格式
- （可选）MDX：在 Markdown 中嵌入 React 组件
- （可选）KaTeX：编写数学公式

### Front-matter 字段完整说明

每篇博文文件开头必须包含 YAML front-matter 块（两行 `---` 之间的内容）：

```yaml
---
# ✅ 必填字段
title: "文章标题"
pubDatetime: 2024-01-15T10:00:00+08:00   # 发布时间，必须包含时区偏移（推荐 +08:00）
description: "文章摘要，显示在文章列表卡片和社交分享预览图中，建议 50~150 字"

# 🔧 可选字段（省略时使用默认值）
author: "刘念"                             # 默认取 src/config.ts 中的 SITE.author
modDatetime: 2024-03-01T10:00:00+08:00    # 最后修改时间（有此字段时，文章列表按修改时间排序）
tags: ["javascript", "react", "前端"]     # 标签数组，默认 ["others"]；用于分类和筛选
featured: false                            # true 时文章会显示在首页的"精选"区域
draft: false                               # true 时文章仅在 pnpm dev 开发模式下可见，不会出现在生产构建中
ogImage: "./cover.jpg"                     # 自定义 OG 图片（本地相对路径或完整 URL），省略时自动生成动态 OG 图
canonicalURL: "https://example.com/post"  # 原文地址（用于 <link rel="canonical">，避免重复内容）
hideEditPost: false                        # true 时隐藏文章底部的"编辑本页"按钮（需 SITE.editPost.enabled = true）
timezone: "Asia/Tokyo"                    # 覆盖全局时区设置（IANA 格式），用于正确解析 pubDatetime
---
```

> **注意**：front-matter 字段由 `src/content.config.ts` 中的 Zod schema 定义，字段类型不匹配时构建会报错。

### 新建博文步骤

1. 在 `src/data/blog/` 目录下新建 `.md` 或 `.mdx` 文件：
   ```
   src/data/blog/我的新文章.md
   ```
2. 写入 front-matter（参考上方模板）。
3. 在 front-matter 下方编写正文内容。
4. 执行 `pnpm dev` 启动开发服务器，在浏览器中预览效果。

### 使用目录（Table of Contents）

在正文中插入以下标题，`remark-toc` 会自动在此处生成目录，`remark-collapse` 会将其包裹在可折叠的 `<details>` 元素中：

```markdown
## Table of contents
```

### 使用数学公式（KaTeX）

行内公式使用单个 `$` 包裹：

```markdown
质能方程：$E = mc^2$
```

独立公式块使用 `$$` 包裹：

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

支持的 KaTeX 语法请参考 [KaTeX 官方文档](https://katex.org/docs/supported.html)。

### 在 MDX 中嵌入 React 组件

将文件扩展名改为 `.mdx`，然后在 front-matter 下方导入组件：

```mdx
---
title: "液态玻璃效果探索"
pubDatetime: 2024-07-01T00:00:00+08:00
description: "深入了解 iOS Liquid Glass 效果的实现原理"
tags: ["react", "css", "动画"]
---

import { Playground } from "@/components/LiquidGlass/Playground";

## 交互演示

拖动下方滑块，实时调整玻璃参数：

<Playground />
```

---

## 三、修改页面布局与路由

页面和布局使用 **Astro**（`.astro`）文件编写，语法是 HTML 的超集，并在文件开头的 `---` 代码块中编写服务端 TypeScript 逻辑。

### 所需技能

- **Astro 组件语法**：理解 `---` 代码块（编译时执行的 TypeScript）和 HTML 模板部分
- **Astro 文件路由**：`src/pages/` 中的文件结构直接映射 URL
- **Astro 内容集合**：理解 `getCollection()`、`getEntry()` 的用法
- **TypeScript**：组件 props 类型标注、工具函数调用
- **Tailwind CSS v4**：在模板中直接使用工具类

### Astro 组件结构示例

```astro
---
// 这里的代码在构建时（服务端）执行，不会出现在客户端 JavaScript 中
import { getCollection } from "astro:content";
import Layout from "@/layouts/Layout.astro";
import { getSortedPosts } from "@/utils/getSortedPosts";

// 获取所有已发布的博文并排序
const posts = await getCollection("blog");
const sortedPosts = getSortedPosts(posts);
---

<!-- 这里是 HTML 模板，支持 Astro 模板语法 -->
<Layout title="博文列表">
  <main>
    {sortedPosts.map(post => (
      <article>
        <a href={`/posts/${post.id}/`}>{post.data.title}</a>
      </article>
    ))}
  </main>
</Layout>
```

### 关键页面文件

| 文件 | URL | 说明 |
|---|---|---|
| `src/pages/index.astro` | `/` | 首页，展示精选文章和最新文章 |
| `src/pages/posts/[...page].astro` | `/posts/` | 文章列表，支持分页（`[...page]` 为可选的页码参数） |
| `src/pages/posts/[...slug]/index.astro` | `/posts/文章id/` | 文章详情页，通过 `slug` 动态匹配博文 |
| `src/pages/tags/index.astro` | `/tags/` | 标签列表页 |
| `src/pages/tags/[tag]/[...page].astro` | `/tags/标签名/` | 按标签筛选的文章列表 |
| `src/pages/archives/index.astro` | `/archives/` | 归档页，按年月分组展示所有文章 |
| `src/pages/search.astro` | `/search/` | 全文搜索页（Pagefind UI） |
| `src/pages/404.astro` | `404` | 自定义 404 页面 |

### 关键布局文件

| 文件 | 说明 |
|---|---|
| `src/layouts/Layout.astro` | 根布局：输出完整 HTML 文档，包含 `<head>` 元信息、主题脚本、Google 站点验证 meta 标签 |
| `src/layouts/Main.astro` | 主内容区域包装器，提供统一的 `<main>` 结构和 aria 属性 |
| `src/layouts/PostDetails.astro` | 博文详情页布局：文章头部信息（标题、日期、标签）、正文、分享按钮、返回按钮 |
| `src/layouts/AboutLayout.astro` | 关于页面布局（如有） |

---

## 四、修改或新增 UI 组件

### 4.1 Astro 组件（`src/components/*.astro`）

大多数通用 UI 组件是 Astro 组件，没有客户端 JavaScript 开销。

**所需技能：**
- Astro 组件语法（同上）
- Tailwind CSS v4 工具类
- SVG 基础（`src/assets/icons/` 中的图标是内联 SVG，直接作为 Astro 组件导入）

**现有组件列表：**

| 组件 | 说明 |
|---|---|
| `Header.astro` | 顶部导航栏（站点标题、导航链接、搜索按钮、主题切换按钮） |
| `Footer.astro` | 页面底部（版权信息、社交链接） |
| `Card.astro` | 文章列表卡片（标题、摘要、日期、标签） |
| `Datetime.astro` | 日期时间显示组件，基于 Day.js 格式化，支持时区 |
| `Tag.astro` | 标签徽章组件 |
| `Pagination.astro` | 分页导航组件 |
| `Breadcrumb.astro` | 面包屑导航 |
| `BackButton.astro` | 返回上一页按钮 |
| `BackToTopButton.astro` | 回到顶部按钮 |
| `EditPost.astro` | "编辑本页"按钮（链接到 GitHub 编辑页面） |
| `ShareLinks.astro` | 社交分享链接（Twitter/X、Facebook 等） |
| `Socials.astro` | 社交媒体图标链接组 |
| `LinkButton.astro` | 通用链接按钮（支持内部和外部链接） |
| `Hr.astro` | 水平分割线 |

### 4.2 React 组件（`src/components/LiquidGlass/*.tsx`）

需要客户端交互状态的组件使用 React 编写，通过 `@astrojs/react` 集成接入 Astro。

**所需技能：**
- **React v19**：函数式组件、Hooks（`useState`、`useRef`、`useEffect`、`useId`、`useCallback`）
- **TypeScript + React**：`React.FC`、泛型类型、`useRef<HTMLElement>`、`ComponentPropsWithoutRef`
- **Motion（`motion/react`）v12**：
  - `useMotionValue`：创建不触发重渲染的响应式值
  - `useTransform`：从 MotionValue 派生新值（类似 computed）
  - `useInView`：检测元素是否进入视口
  - `motion.*` 组件：支持 MotionValue 直接绑定到 DOM 属性
- **Lucide React** 和 **React Icons**：图标组件

**LiquidGlass 组件额外需要：**
- SVG 滤镜原语：`feDisplacementMap`、`feColorMatrix`、`feGaussianBlur`、`feImage`、`feBlend`、`feComposite`、`feComponentTransfer`
- 基础线性代数：向量点积、叉积、法线计算（用于折射光线方向计算）
- 斯涅尔折射定律（Snell's Law）：`n₁ sin θ₁ = n₂ sin θ₂`
- Phong 着色模型（镜面高光计算）
- Canvas API：`ImageData`、逐像素操作（`data[i * 4]` = R，`[i*4+1]` = G，`[i*4+2]` = B，`[i*4+3]` = A）
- Node.js `canvas` 包（`node-canvas`）：在构建时（SSR）使用 Canvas API

**在 Astro 页面中使用 React 组件：**

需要添加 `client:` 指令才能在浏览器中激活（hydrate）：

```astro
---
import { Playground } from "@/components/LiquidGlass/Playground";
---

<!-- client:load：页面加载完成后立即激活 -->
<Playground client:load />

<!-- client:visible：元素进入视口后才激活（节省首屏资源） -->
<Playground client:visible />

<!-- client:idle：浏览器空闲时激活 -->
<Playground client:idle />
```

---

## 五、修改样式与主题

全局样式位于 `src/styles/global.css` 和 `src/styles/typography.css`。

### 所需技能

- **Tailwind CSS v4**：包括 `@theme`、`@utility`、`@layer`、`@custom-variant` 等指令
- **CSS 自定义属性**（CSS Custom Properties）：主题色变量的定义与使用
- **`@tailwindcss/typography` 插件**：`prose` 类及其定制选项

### 修改主题颜色

在 `src/styles/global.css` 中修改 CSS 自定义属性：

```css
/* 修改亮色主题颜色 */
:root,
html[data-theme="light"] {
  --background: #fdfdfd;   /* 页面背景色 */
  --foreground: #282728;   /* 主要文字颜色 */
  --accent: #006cac;       /* 强调色：链接、按钮、高亮等 */
  --muted: #e6e6e6;        /* 弱化元素背景：标签、分割线 */
  --border: #ece9e9;       /* 边框颜色 */
}

/* 修改暗色主题颜色 */
html[data-theme="dark"] {
  --background: #212737;
  --foreground: #eaedf3;
  --accent: #ff6b01;
  --muted: #343f60;
  --border: #ab4b08;
}
```

修改后，所有使用 `bg-background`、`text-foreground`、`text-accent` 等 Tailwind 工具类的地方会自动更新。

### 添加自定义 Tailwind 工具类

在 `src/styles/global.css` 中使用 `@utility` 指令：

```css
@utility my-card {
  @apply rounded-lg border border-border bg-muted p-4 shadow-sm;
}
```

### 修改博文正文排版

`src/styles/typography.css` 文件基于 `@tailwindcss/typography` 扩展博文正文样式。如需修改字体大小、行高、链接样式等，在此文件中添加 `.prose` 选择器的覆盖规则。

---

## 六、工具函数与全局配置

### 所需技能

- TypeScript
- Astro 内容集合 API（`CollectionEntry<"blog">` 类型）
- 基本的日期处理（Day.js）

### 修改全局站点配置

编辑 `src/config.ts` 中的 `SITE` 常量：

```typescript
export const SITE = {
  website: "https://liunian.js.org",  // 网站部署域名（影响 OG 图片 URL、站点地图等）
  author: "刘念",                      // 文章默认作者
  title: "刘念的个人博客",              // 站点标题（显示在浏览器标签页和 OG 图片中）
  desc: "...",                         // 站点描述（用于 SEO meta description）
  ogImage: "astropaper-og.jpg",        // 默认 OG 图片（public/ 目录下的文件名）
  lang: "zh-cn",                       // HTML lang 属性
  timezone: "Asia/Shanghai",           // 全局时区（IANA 格式）
  postPerIndex: 4,                     // 首页显示的文章数
  postPerPage: 4,                      // 文章列表每页显示的文章数
  scheduledPostMargin: 15 * 60 * 1000, // 定时发布文章的提前显示时间（毫秒），默认 15 分钟
  showArchives: true,                  // 是否显示归档页（同时控制站点地图中是否包含 /archives）
  showBackButton: true,                // 文章详情页是否显示"返回"按钮
  dynamicOgImage: true,                // 是否为每篇文章生成动态 OG 图片
  lightAndDarkMode: true,              // 是否启用明暗主题切换功能
  dir: "auto",                         // 文字方向："ltr" | "rtl" | "auto"
  editPost: {
    enabled: false,                    // 是否显示"编辑本页"按钮
    text: "Edit page",                 // 按钮文字
    url: "https://github.com/liunnn1994/edit/main/", // GitHub 编辑链接前缀
  },
};
```

### 关键工具函数

| 文件 | 函数 | 说明 |
|---|---|---|
| `src/utils/getSortedPosts.ts` | `getSortedPosts(posts)` | 过滤草稿和未发布文章，并按发布/修改时间降序排序 |
| `src/utils/postFilter.ts` | `postFilter(post)` | 判断文章是否应该显示（非草稿 + 已到发布时间） |
| `src/utils/getPostsByTag.ts` | `getPostsByTag(posts, tag)` | 按标签过滤文章列表 |
| `src/utils/getUniqueTags.ts` | `getUniqueTags(posts)` | 提取并去重所有文章的标签列表 |
| `src/utils/slugify.ts` | `slugifyStr(str)` | 将字符串转换为 URL 安全的 kebab-case slug |
| `src/utils/getPath.ts` | `getPath(post)` | 生成文章的 URL 路径 |
| `src/utils/getPostsByGroupCondition.ts` | — | 按分组条件（如年月）聚合文章，用于归档页 |

---

## 七、OG 图片模板

每篇文章的社交分享预览图（Open Graph 图片）在构建时自动生成。

### 所需技能

- **Satori JSX 模板语法**：使用类 JSX 的对象树描述图片布局（与 React 组件写法类似，但不支持所有 CSS 属性，详见 [Satori 文档](https://github.com/vercel/satori)）
- **基础图片处理概念**：理解 SVG → PNG 转换管线
- **字体加载**：`src/utils/loadGoogleFont.ts` 在构建时通过 HTTP 请求获取 Google Fonts 字体二进制数据，嵌入 SVG 以保证渲染一致性

### 模板文件位置

- `src/utils/og-templates/post.js`：单篇文章的 OG 图片模板
- `src/utils/og-templates/site.js`：网站首页 OG 图片模板

### OG 图片生成流程

```typescript
// src/utils/generateOgImages.ts

// 1. 调用 JSX 模板函数，传入文章数据，得到 SVG 字符串
const svg = await postOgImage(post);

// 2. 用 @resvg/resvg-js 将 SVG 光栅化为 PNG Buffer
const resvg = new Resvg(svg);
const pngData = resvg.render();
return pngData.asPng();
```

---

## 八、构建、工具链与 CI

### 所需技能

- **pnpm**：工作区配置（`pnpm-workspace.yaml`）、`pnpm install`、`pnpm run <script>`
- **Node.js LTS**：构建管线运行时环境
- **ESLint v9 Flat Config**（`eslint.config.js`）：规则调整、插件配置
- **Prettier v3**（`.prettierrc.mjs`）：格式化选项调整
- **Docker**：多阶段 Dockerfile 修改；`docker-compose.yml` 端口和服务配置
- **Conventional Commits**：提交信息规范（由 Commitizen `cz.yaml` 强制执行）

### 提交信息规范（Conventional Commits）

本项目强制使用规范化提交信息格式：

```
<类型>(<范围>): <简短描述>

[可选的详细描述]

[可选的关联 issue：Fixes #123]
```

常用类型：

| 类型 | 说明 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 代码重构 |
| `chore` | 构建流程、依赖更新等杂项 |
| `perf` | 性能优化 |

示例：

```
feat(blog): 新增文章阅读时间估算功能

根据文章字数和平均阅读速度（200字/分钟）计算预计阅读时长，
并显示在文章卡片和详情页顶部。

Closes #42
```

### 添加新依赖

```bash
# 安装生产依赖
pnpm add <包名>

# 安装开发依赖
pnpm add -D <包名>

# 安装后更新 pnpm-lock.yaml（自动完成）
# 提交时必须同时提交 package.json 和 pnpm-lock.yaml
```

---

## 九、代码规范

### 格式化（Prettier）

所有代码提交前必须通过 Prettier 格式化：

```bash
pnpm format        # 自动修复格式问题
pnpm format:check  # 仅检查（不修改，用于 CI）
```

核心格式规则（来自 `.prettierrc.mjs`）：

- 2 空格缩进
- 双引号（`"`)，不使用单引号
- 语句末尾加分号
- 最大行宽 80 字符
- 统一 LF 换行符
- Tailwind 工具类自动按推荐顺序排列（`prettier-plugin-tailwindcss`）

### 代码检查（ESLint）

```bash
pnpm lint          # 检查所有文件
```

强制规则：

- `no-console: "error"`：禁止在代码中使用 `console.log` 等（防止调试代码泄露到生产环境）
- TypeScript 推荐规则：避免隐式 `any`、正确使用类型断言等
- Astro 推荐规则：Astro 组件最佳实践

### TypeScript 严格模式

`tsconfig.json` 继承 `astro/tsconfigs/strict`，要求：

- 所有变量和参数必须有类型（禁止隐式 `any`）
- 空值检查（避免 `null` / `undefined` 相关的运行时错误）
- 路径别名 `@/` 指向 `src/` 目录（如 `import { SITE } from "@/config"`）

---

## 十、技能速查表

| 贡献类型 | 必须掌握 | 有帮助但非必须 |
|---|---|---|
| 撰写博文（Markdown） | Markdown 语法、YAML front-matter | — |
| 撰写博文（MDX） | Markdown、MDX、React 基础 | KaTeX（数学公式） |
| 修改页面与路由 | Astro 组件语法、TypeScript、Tailwind CSS v4 | Astro 内容集合 API |
| Astro UI 组件 | Astro 语法、Tailwind CSS、内联 SVG | — |
| React 交互组件 | React v19、TypeScript、Motion v12 | Lucide React、React Icons |
| LiquidGlass 物理组件 | React、TypeScript、SVG 滤镜、Canvas API | 线性代数、折射物理、Phong 着色 |
| 样式与主题 | Tailwind CSS v4、CSS 自定义属性 | `@tailwindcss/typography` |
| OG 图片模板 | Satori JSX、Node.js | resvg、sharp |
| 全局配置 | TypeScript | Astro 配置 API |
| 构建与工具链 | pnpm、Node.js LTS、ESLint、Prettier | Docker、Commitizen |

---

## 十一、获取帮助

- [Astro 官方文档](https://docs.astro.build)（含中文版）
- [Tailwind CSS v4 文档](https://tailwindcss.com/docs)
- [Motion（Framer Motion 继任者）文档](https://motion.dev/docs)
- [Pagefind 文档](https://pagefind.app/docs)
- [Satori（OG 图片生成）文档](https://github.com/vercel/satori)
- [KaTeX 支持的语法列表](https://katex.org/docs/supported.html)
- [Conventional Commits 规范](https://www.conventionalcommits.org/zh-hans/)
- 在 GitHub 上 [提交 Issue 或 Discussion](https://github.com/liunnn1994/liunnn1994.github.io/issues)
