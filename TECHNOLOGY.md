# 技术栈分析文档

本文档对 **liunnn1994.github.io**（个人中文技术博客，线上地址：<https://liunian.js.org>）所使用的全部技术进行系统性分析，涵盖框架选型、依赖库说明、工程化工具链以及部署方案。

---

## 一、核心框架

| 技术 | 版本 | 作用 |
|---|---|---|
| [Astro](https://astro.build) | v5 | 静态站点生成器（SSG），负责编排所有页面、布局和内容集合 |
| [TypeScript](https://www.typescriptlang.org) | v5 | 项目主要编程语言，覆盖全部 `.ts` / `.tsx` 源文件 |
| [React](https://react.dev) | v19 | 用于需要客户端交互的 UI 组件（通过 `@astrojs/react` 集成接入） |

### Astro 工作原理详解

Astro 是一个以**内容优先**为设计哲学的静态站点生成器，其核心特性如下：

- **群岛架构（Islands Architecture）**：默认输出零 JavaScript，只有显式标注 `client:load` / `client:visible` 等指令的组件才会在浏览器端激活（hydration），其余全部在构建时渲染为静态 HTML。
- **内容集合（Content Collections）**：通过 `src/content.config.ts` 定义集合 schema，使用 Zod 进行类型校验，确保每篇博文的 front-matter 字段完整且类型正确。博文以 Markdown / MDX 文件的形式存放于 `src/data/blog/`，由 `glob` loader 自动发现。
- **文件路由（File-based Routing）**：`src/pages/` 目录下的每个 `.astro` 文件自动对应一条 URL 路由，动态路由通过 `[...slug]` 命名约定实现。
- **构建输出**：执行 `astro build` 后，所有页面渲染为静态 HTML 文件，输出到 `dist/` 目录，可直接部署到任意静态托管服务。

`src/config.ts` 中导出的 `SITE` 常量集中管理全站配置：

```typescript
export const SITE = {
  website: "https://liunian.js.org", // 部署域名
  author: "刘念",
  title: "刘念的个人博客",
  lang: "zh-cn",                     // HTML lang 属性
  timezone: "Asia/Shanghai",         // Day.js 时区（IANA 格式）
  postPerPage: 4,                    // 每页显示文章数
  dynamicOgImage: true,              // 是否为每篇文章生成动态 OG 图片
  // ...
};
```

### TypeScript 配置

`tsconfig.json` 继承自 `astro/tsconfigs/strict`（启用严格模式），并额外配置了：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }, // 路径别名，@ 指向 src 目录
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

禁用 `any`（严格模式），所有组件 props 必须显式标注类型。

---

## 二、样式方案

| 技术 | 版本 | 作用 |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | v4 | 原子化 CSS 框架，以 Vite 插件 `@tailwindcss/vite` 方式接入 |
| [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) | v0.5 | 为博文正文（Markdown 渲染内容）提供排版样式（`prose` 类） |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | v3 | 运行时合并冲突的 Tailwind 工具类，避免类名叠加导致样式异常 |

### Tailwind CSS v4 与 v3 的主要差异

- **配置方式**：v4 不再使用 `tailwind.config.js`，改为直接在 CSS 文件中通过 `@theme` 指令定义设计 token。
- **接入方式**：以 Vite 插件形式接入（`@tailwindcss/vite`），无需独立的 PostCSS 配置文件。
- **新增指令**：`@utility`（自定义工具类）、`@custom-variant`（自定义变体）、`@theme inline`（内联 token 定义）。

### 明暗主题系统详解

主题色通过 CSS 自定义属性（CSS Custom Properties）定义，位于 `src/styles/global.css`：

```css
/* 亮色主题（默认） */
:root,
html[data-theme="light"] {
  --background: #fdfdfd;   /* 背景色 */
  --foreground: #282728;   /* 文字色 */
  --accent: #006cac;       /* 强调色（链接、高亮等） */
  --muted: #e6e6e6;        /* 弱化背景（标签、分割线等） */
  --border: #ece9e9;       /* 边框色 */
}

/* 暗色主题 */
html[data-theme="dark"] {
  --background: #212737;
  --foreground: #eaedf3;
  --accent: #ff6b01;       /* 暗色下强调色为橙色 */
  --muted: #343f60;
  --border: #ab4b08;
}

/* 将 CSS 变量映射为 Tailwind 主题 token */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-muted: var(--muted);
  --color-border: var(--border);
}
```

切换逻辑：
- `public/toggle-theme.js` 在页面加载最早期执行（`<head>` 内内联），读取 `localStorage` 中保存的主题偏好，并在 `<html>` 元素上设置 `data-theme` 属性，防止页面闪烁（FOUC）。
- Tailwind 通过 `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))` 识别暗色模式，这比默认的 `prefers-color-scheme` 媒体查询方案更精确，允许用户手动覆盖系统设置。

---

## 三、内容创作

| 技术 | 版本 | 作用 |
|---|---|---|
| Markdown / [MDX](https://mdxjs.com) | — | 博文格式，存放于 `src/data/blog/*.{md,mdx}` |
| [remark-toc](https://github.com/remarkjs/remark-toc) | v9 | 在 Markdown 中自动生成目录（Table of Contents） |
| [remark-collapse](https://github.com/Rokt33r/remark-collapse) | v0.1 | 将目录折叠为可展开的 `<details>` 元素 |
| [remark-math](https://github.com/remarkjs/remark-math) | v6 | 解析 Markdown 中的 LaTeX 数学表达式（`$...$` 和 `$$...$$`） |
| [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex) | v7 | 将解析出的数学表达式渲染为 KaTeX HTML |

### 博文 Front-matter Schema（完整字段说明）

以下字段由 `src/content.config.ts` 中的 Zod schema 定义和校验：

```yaml
---
title: "文章标题"                          # 必填，string
pubDatetime: 2024-01-01T10:00:00+08:00    # 必填，Date，发布时间（支持时区偏移）
modDatetime: 2024-06-01T10:00:00+08:00    # 可选，Date，最后修改时间（用于排序和显示）
author: "刘念"                             # 可选，string，默认取 SITE.author
tags: ["javascript", "react"]             # 可选，string[]，默认 ["others"]
description: "文章摘要，显示在列表和 OG 图片中"  # 必填，string
featured: false                            # 可选，boolean，置顶到首页
draft: false                               # 可选，boolean，true 时只在开发环境可见
ogImage: "./cover.png"                     # 可选，本地图片路径或远程 URL，覆盖动态 OG 图
canonicalURL: "https://example.com/post"  # 可选，string，设置 canonical 链接
hideEditPost: false                        # 可选，boolean，隐藏"编辑本页"按钮
timezone: "Asia/Tokyo"                    # 可选，string，覆盖全局时区设置
---
```

### MDX 与 Markdown 的区别

- **Markdown（`.md`）**：纯文本格式，适合大多数博文，编译时通过 remark/rehype 插件处理。
- **MDX（`.mdx`）**：Markdown 的超集，支持在文档中直接导入并渲染 React 组件，适合需要交互演示的技术博文（如 `liquid-glass.mdx`）。

MDX 中导入组件示例：

```mdx
import { Playground } from "@/components/LiquidGlass/Playground";

# 液态玻璃效果探索

下面是一个可以交互的演示：

<Playground />
```

---

## 四、代码高亮

| 技术 | 版本 | 作用 |
|---|---|---|
| [Shiki](https://shiki.style)（Astro 内置） | — | 代码块语法高亮，支持数百种语言 |
| [@shikijs/transformers](https://shiki.style/packages/transformers) | v3 | 扩展代码块功能：diff 标注、高亮行、单词高亮 |
| 自定义 `transformers/fileName.js` | — | 在代码块顶部显示文件名标签 |

### 高亮主题配置

在 `astro.config.ts` 中配置了双主题（亮色/暗色分别使用不同主题）：

```typescript
shikiConfig: {
  themes: {
    light: "min-light",   // 亮色主题：简洁白色风格
    dark: "night-owl",    // 暗色主题：蓝绿色夜晚风格
  },
  defaultColor: false,    // 不使用单一颜色变量，允许双主题 CSS 变量共存
  wrap: false,            // 不自动折行（保持代码原始宽度，支持横向滚动）
}
```

### Shiki Transformers 详解

- **`transformerNotationDiff`**：在代码行注释中加入 `// [!code --]` 或 `// [!code ++]` 即可渲染 diff 样式（红色删除、绿色新增）。
- **`transformerNotationHighlight`**：通过 `// [!code highlight]` 高亮指定行。
- **`transformerNotationWordHighlight`**：通过 `// [!code word:关键词]` 高亮指定单词。
- **`transformerFileName`**（自定义）：解析代码块开头的 `` ```ts filename.ts `` 语法，在代码块顶部插入文件名标签，`style: "v2"` 为当前使用的外观样式。

---

## 五、全文搜索

| 技术 | 版本 | 作用 |
|---|---|---|
| [Pagefind](https://pagefind.app) | v1 | 构建时生成客户端全文搜索索引 |
| [@pagefind/default-ui](https://pagefind.app/docs/ui/) | v1 | 开箱即用的搜索 UI 组件，嵌入 `src/pages/search.astro` |

### 工作流程

1. 执行 `astro build` 生成静态 HTML。
2. 紧接着执行 `pagefind --site dist`，Pagefind 扫描 `dist/` 中所有 HTML 文件，提取文本内容，生成搜索索引（位于 `dist/pagefind/`）。
3. 执行 `cp -r dist/pagefind public/`，将索引复制到 `public/` 目录，使其在开发服务器中也可访问。
4. 页面端通过 `@pagefind/default-ui` 提供的 `PagefindUI` 组件渲染搜索框，用户输入关键词时在本地执行搜索，**无需后端服务器**，完全在浏览器中完成。

---

## 六、Open Graph 图片动态生成

每篇博文在构建时自动生成一张 Open Graph（社交分享预览）图片，整个管道如下：

```
JSX 模板 → Satori → SVG 字符串 → @resvg/resvg-js → PNG Buffer → 输出为 /posts/[slug]/index.png
```

| 技术 | 版本 | 作用 |
|---|---|---|
| [Satori](https://github.com/vercel/satori) | v0.18 | 将类 JSX 的对象树渲染为 SVG（不依赖浏览器 DOM） |
| [@resvg/resvg-js](https://github.com/yisibl/resvg-js) | v2.6 | 基于 Rust 的 SVG 光栅化库，将 SVG 字符串转换为 PNG |
| [sharp](https://sharp.pixelplumbing.com) | v0.34 | 高性能图片处理库，负责图片压缩和格式转换 |
| [canvas](https://github.com/Automattic/node-canvas) | v3.2 | Node.js Canvas API 实现，供 OG 模板工具函数使用 |
| `src/utils/loadGoogleFont.ts` | — | 在构建时通过 HTTP 请求获取 Google Fonts 字体数据，嵌入 SVG |

**关键文件说明：**

- `src/utils/og-templates/post.js`：单篇文章的 OG 图片 JSX 模板（包含文章标题、作者、标签等信息）。
- `src/utils/og-templates/site.js`：网站首页 OG 图片模板。
- `src/utils/generateOgImages.ts`：封装 Satori + resvg 流程，对外暴露 `generateOgImageForPost` 和 `generateOgImageForSite` 两个函数。
- `src/pages/posts/[...slug]/index.png.ts`：Astro 路由文件，按需为每篇文章输出对应的 `.png` 文件。
- `src/pages/og.png.ts`：网站首页 OG 图片路由。

---

## 七、动画与图标

| 技术 | 版本 | 作用 |
|---|---|---|
| [Motion](https://motion.dev)（`motion/react`） | v12 | 基于物理弹簧的动画库，驱动交互式 React 组件 |
| [Lucide React](https://lucide.dev) | v0.544 | 一致风格的 SVG 图标集 |
| [React Icons](https://react-icons.github.io/react-icons/) | v5 | 汇聚多个主流图标库（FontAwesome、Bootstrap Icons 等） |

### Motion (`motion/react`) 核心 API 说明

Motion 是 Framer Motion 的继任者，本项目主要使用以下 API：

- **`useMotionValue(初始值)`**：创建一个"运动值"（MotionValue），可以在不触发 React 重渲染的情况下高频更新（适合动画帧级别的更新）。
- **`useTransform(motionValue, fn)`**：从已有运动值派生出新的运动值（类似 Vue 的 `computed`），在 LiquidGlass 组件中广泛用于实时计算位移贴图。
- **`useInView(ref, options)`**：检测元素是否进入视口，用于触发进入视口时的动画（如 `Playground.tsx` 中的懒加载渲染）。
- **`motion.feImage`、`motion.feDisplacementMap` 等**：Motion 将 HTML/SVG 元素包装为支持 MotionValue 绑定的组件，这样 SVG 滤镜参数可以在不走 React diff 的情况下直接更新 DOM 属性。

---

## 八、LiquidGlass 交互组件（核心特色）

`src/components/LiquidGlass/` 是本项目最具技术含量的模块——一套完全在浏览器中模拟 iOS 液态玻璃（Liquid Glass）视觉效果的 React 组件。

### 效果原理概述

真实玻璃通过**折射（Refraction）**改变光线方向，使玻璃后方的物体产生扭曲。浏览器中模拟这一效果的核心是 SVG 滤镜中的 `<feDisplacementMap>` 元素：它根据一张"位移贴图"（Displacement Map）对像素坐标进行偏移，从而产生视觉上的折射扭曲。

### 渲染管线（逐步骤说明）

```
用户输入参数（厚度、折射率、圆角等）
        ↓
surfaceEquations.ts  → 定义玻璃截面的曲线函数
        ↓
displacementMap.ts   → 基于折射定律（Snell's Law）计算每个像素的位移量
        ↓
specular.ts          → 基于 Phong 模型计算高光层（模拟玻璃表面反光）
        ↓
canvas (node-canvas)  → 将计算结果写入 ImageData，转换为 Data URL
        ↓
Filter.tsx           → 将 Data URL 嵌入 <feImage>，通过 <feDisplacementMap> 应用位移
                        通过 <feBlend> 叠加高光层
        ↓
最终视觉效果：玻璃后方内容扭曲 + 边缘高光
```

### 各文件详细说明

| 文件 | 说明 |
|---|---|
| `Filter.tsx` | 核心 SVG 滤镜组件。使用 Motion 的 `useTransform` 将 MotionValue 参数实时映射为滤镜参数，避免频繁 React 重渲染。滤镜管线：高斯模糊 → 位移贴图 → 饱和度增强 → 叠加高光层。 |
| `displacementMap.ts` | 根据折射定律（Snell's Law）和表面曲线函数，逐像素计算水平/垂直位移量，输出 `ImageData`（RGBA 像素数据，R 通道 = 水平位移，G 通道 = 垂直位移）。 |
| `magnifyingDisplacement.ts` | 计算放大镜效果的位移贴图（单独用于 `MagnifyingGlass.tsx`）。 |
| `surfaceEquations.ts` | 定义玻璃截面曲线的数学函数，包含四种预设：凸圆形（`CONVEX_CIRCLE`）、凸方形（`CONVEX`）、凹形（`CONCAVE`）、唇形（`LIP`，混合凸凹，模拟 iOS 原生 Liquid Glass 外观）。 |
| `rayColor.ts` | 光线追踪工具函数，计算折射后每条光线对应的像素颜色，考虑了玻璃厚度对色散的影响。 |
| `specular.ts` | 基于 Phong 着色模型计算镜面高光层：模拟玻璃边缘的光泽反射，输出带透明度的高光 `ImageData`，最终通过 `<feBlend>` 叠加到折射图像上。 |
| `imageDataToUrl.ts` | 将 `ImageData` 借助 `node-canvas` 写入 Canvas，再通过 `canvas.toDataURL()` 导出为 `data:image/png;base64,...` 字符串，供 SVG `<feImage>` 的 `href` 属性使用。 |
| `Playground.tsx` | 完整的交互演示组件，允许用户实时调节玻璃厚度、折射率、表面方程等参数，并通过光线追踪动画展示光线路径。嵌入在 `liquid-glass.mdx` 博文中。 |
| `RayRefractionSimulation.tsx` / `RayRefractionSimulationMini.tsx` | 光线折射物理过程的可视化教学组件（大号和小号两个版本）。 |
| `useValueOrMotion.tsx` | 自定义 Hook，统一处理"普通值"和"MotionValue"两种输入形式，内部通过 `value instanceof MotionValue ? value.get() : value` 判断。 |
| `Buttons.tsx` / `Searchbox.tsx` / `Switch.tsx` / `Slider.tsx` | 具有液态玻璃视觉效果的 UI 基础组件（按钮、搜索框、开关、滑块）。 |
| `MixedUI.tsx` | 综合展示多种 LiquidGlass UI 组件的演示页面。 |
| `SpecularPreview.tsx` | 单独展示高光效果的预览组件。 |
| `VectorToRedGreen.tsx` | 将位移向量场可视化为红绿色图（辅助调试位移贴图）。 |
| `DisplacementVectorField.tsx` | 渲染位移向量场的箭头图示，用于教学说明。 |
| `RefractionAnglesExplanation.tsx` | 折射角度关系的可视化说明组件（斯涅尔定律图解）。 |
| `ScreenLightToEyeDiagram.tsx` | 屏幕光线从像素到人眼路径的示意图组件。 |
| `SurfaceEquationSelector.tsx` | 允许用户在不同玻璃表面方程之间切换的选择器组件。 |
| `Functions.tsx` | 渲染各种表面曲线函数的数学图像可视化组件。 |
| `MagnifyingGlass.tsx` | 放大镜效果的完整实现组件。 |

---

## 九、RSS 订阅与站点地图

| 技术 | 作用 |
|---|---|
| [@astrojs/rss](https://docs.astro.build/en/guides/rss/) | 生成 `/rss.xml`，便于读者通过 RSS 阅读器订阅 |
| [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) | 构建时自动生成 `/sitemap-index.xml`，提升搜索引擎收录效率 |

站点地图中可通过 `SITE.showArchives` 配置是否包含 `/archives` 页面（在 `astro.config.ts` 的 sitemap 插件 `filter` 选项中实现）。

---

## 十、日期处理与 URL Slug 工具

| 技术 | 作用 |
|---|---|
| [Day.js](https://day.js.org) | 轻量时区感知日期格式化库，通过 `SITE.timezone`（默认 `Asia/Shanghai`）处理时区转换 |
| [lodash.kebabcase](https://lodash.com/docs/#kebabCase) | 将文章标题转换为 URL 安全的 kebab-case slug（如"惰性函数" → "lazy-function"） |

**文章排序逻辑**（`src/utils/getSortedPosts.ts`）：

1. 先通过 `postFilter` 过滤掉 `draft: true` 的草稿文章，并在生产环境过滤掉未到发布时间的定时文章（允许 15 分钟的提前量，由 `SITE.scheduledPostMargin` 配置）。
2. 再按 `modDatetime`（有则优先）或 `pubDatetime` 降序排列，最新文章排在最前。

---

## 十一、工程化工具链

| 工具 | 版本 | 作用 |
|---|---|---|
| [pnpm](https://pnpm.io) | workspace | 包管理器，通过硬链接节省磁盘空间；`pnpm-workspace.yaml` 配置 monorepo 工作区 |
| [ESLint](https://eslint.org) | v9 | 代码检查，使用 Flat Config 格式（`eslint.config.js`） |
| [Prettier](https://prettier.io) | v3 | 代码格式化 |
| [Commitizen](https://commitizen-tools.github.io/commitizen/) | cz.yaml | 规范化 commit 信息，基于 Conventional Commits 规范 |
| [VS Code](https://code.visualstudio.com) | .vscode/ | 预配置推荐扩展和代码片段，开箱即用 |

### ESLint 配置详解（`eslint.config.js`）

```javascript
export default [
  ...tseslint.configs.recommended,          // TypeScript 推荐规则
  ...eslintPluginAstro.configs.recommended,  // Astro 文件专用规则
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }, // 浏览器和 Node 全局变量
    },
  },
  { rules: { "no-console": "error" } },      // 禁止 console.log 进入代码库
  { ignores: ["dist/**", ".astro", "public/pagefind/**"] },
];
```

### Prettier 配置详解（`.prettierrc.mjs`）

```javascript
export default {
  arrowParens: "avoid",           // 单参数箭头函数省略括号：x => x
  semi: true,                     // 语句末尾加分号
  tabWidth: 2,                    // 2 空格缩进
  printWidth: 80,                 // 每行最大宽度
  singleQuote: false,             // 使用双引号
  trailingComma: "es5",           // ES5 兼容的尾逗号（对象、数组末尾加逗号）
  endOfLine: "lf",                // 统一使用 LF 换行符
  plugins: [
    "prettier-plugin-astro",       // 支持格式化 .astro 文件
    "prettier-plugin-tailwindcss", // 自动排序 Tailwind 工具类
    "prettier-plugin-packagejson", // 规范化 package.json 字段顺序
  ],
  tailwindStylesheet: "./src/styles/global.css", // 指定 Tailwind 样式表路径
};
```

### Commitizen 配置（`cz.yaml`）

```yaml
commitizen:
  name: cz_conventional_commits   # 使用 Conventional Commits 适配器
  tag_format: v$version           # 版本标签格式：v1.0.0
  update_changelog_on_bump: true  # 版本升级时自动更新 CHANGELOG
  version_provider: npm           # 从 package.json 读取版本号
  version_scheme: semver          # 遵循语义化版本规范
```

### 常用脚本（`package.json`）

```bash
pnpm dev            # 启动开发服务器（监听所有网络接口，方便局域网调试）
pnpm build          # 全量构建：TypeScript 类型检查 → astro build → 生成 Pagefind 索引 → 复制索引到 public/
pnpm preview        # 在本地预览构建产物（等同于生产环境效果）
pnpm sync           # 同步 Astro 生成的类型定义文件（.astro/types.d.ts）
pnpm lint           # 运行 ESLint 检查
pnpm format         # 用 Prettier 自动格式化所有文件
pnpm format:check   # 用 Prettier 检查格式问题但不修改文件（适合 CI 环境）
```

---

## 十二、部署方案

| 技术 | 作用 |
|---|---|
| [Docker](https://www.docker.com) | 多阶段构建：第一阶段用 Node LTS 构建静态文件；第二阶段用 `nginx:mainline-alpine-slim`（极小镜像）提供 HTTP 服务 |
| [docker-compose](https://docs.docker.com/compose/) | 本地容器化预览，`docker compose up --build` 启动后访问 `http://localhost:80` |
| GitHub Pages | 主要生产部署目标，将 `dist/` 目录内容推送到 `gh-pages` 分支后自动上线 |

### Dockerfile 多阶段构建说明

```dockerfile
# 阶段一：构建
FROM node:lts AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate  # 启用 pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile  # 严格按 lockfile 安装，确保可重现构建
COPY . .
RUN pnpm run build  # 执行完整构建流程

# 阶段二：运行
FROM nginx:mainline-alpine-slim AS runtime
COPY --from=base /app/dist /usr/share/nginx/html  # 只复制构建产物
EXPOSE 80
```

多阶段构建的优势：最终镜像不包含 Node.js、pnpm 等构建工具，大幅减小镜像体积。

---

## 十三、项目目录结构详解

```
liunnn1994.github.io/
├── src/
│   ├── assets/
│   │   ├── icons/            # 内联 SVG 图标（直接作为 Astro 组件导入）
│   │   └── images/           # 博文或组件用到的本地图片资源
│   ├── components/
│   │   ├── *.astro           # 通用 Astro UI 组件（Header、Footer、Card 等）
│   │   └── LiquidGlass/      # 液态玻璃效果 React 组件套件
│   ├── data/
│   │   └── blog/             # 全部博文（.md / .mdx 文件）
│   ├── layouts/
│   │   ├── Layout.astro      # 根布局：<html>、<head>、主题脚本
│   │   ├── Main.astro        # 主内容区域包装器
│   │   ├── PostDetails.astro # 单篇文章详情页布局
│   │   └── AboutLayout.astro # 关于页面布局
│   ├── pages/
│   │   ├── index.astro                    # 首页
│   │   ├── search.astro                   # 全文搜索页
│   │   ├── archives/index.astro           # 归档页（按月分组）
│   │   ├── posts/[...page].astro          # 文章列表页（分页）
│   │   ├── posts/[...slug]/index.astro    # 文章详情页
│   │   ├── posts/[...slug]/index.png.ts   # 文章 OG 图片生成路由
│   │   ├── tags/index.astro               # 标签列表页
│   │   ├── tags/[tag]/[...page].astro     # 按标签筛选的文章列表
│   │   ├── og.png.ts                      # 网站首页 OG 图片
│   │   ├── rss.xml.ts                     # RSS 订阅源
│   │   └── robots.txt.ts                  # 搜索引擎爬虫指令
│   ├── styles/
│   │   ├── global.css        # 全局样式、主题 CSS 变量、Tailwind 基础配置
│   │   └── typography.css    # 博文正文排版样式（基于 @tailwindcss/typography 扩展）
│   ├── utils/
│   │   ├── generateOgImages.ts         # OG 图片生成入口
│   │   ├── getSortedPosts.ts           # 文章排序（含草稿过滤和定时发布逻辑）
│   │   ├── postFilter.ts               # 文章过滤谓词函数
│   │   ├── getPostsByTag.ts            # 按标签获取文章列表
│   │   ├── getPostsByGroupCondition.ts # 按分组条件（如按年月）获取文章
│   │   ├── getUniqueTags.ts            # 提取全站唯一标签列表
│   │   ├── slugify.ts                  # 标题 → URL slug 转换（基于 lodash.kebabcase）
│   │   ├── getPath.ts                  # 文章 URL 路径生成工具
│   │   ├── loadGoogleFont.ts           # 构建时获取 Google Fonts 字体数据
│   │   ├── og-templates/
│   │   │   ├── post.js                 # 文章 OG 图片 JSX 模板
│   │   │   └── site.js                 # 网站首页 OG 图片 JSX 模板
│   │   └── transformers/
│   │       └── fileName.js             # 自定义 Shiki Transformer：代码块文件名标签
│   ├── config.ts             # 全站配置常量（SITE 对象）
│   └── content.config.ts     # 内容集合定义（博文 schema、字段校验）
├── public/
│   ├── favicon.svg           # 网站图标
│   ├── toggle-theme.js       # 主题切换脚本（内联到 <head>，防止 FOUC）
│   └── astropaper-og.jpg     # 默认 OG 图片（当文章未生成动态 OG 图时使用）
├── .vscode/
│   ├── extensions.json       # 推荐安装的 VS Code 扩展
│   ├── launch.json           # 调试配置
│   └── astro-paper.code-snippets  # Astro 代码片段（快速插入 front-matter 等）
├── astro.config.ts           # Astro 及所有集成的完整配置
├── tsconfig.json             # TypeScript 编译配置
├── eslint.config.js          # ESLint Flat Config
├── .prettierrc.mjs           # Prettier 格式化配置
├── cz.yaml                   # Commitizen conventional commits 配置
├── pnpm-workspace.yaml       # pnpm monorepo 工作区配置
├── Dockerfile                # 容器化构建定义
├── docker-compose.yml        # 本地容器编排配置
├── remark-collapse.d.ts      # remark-collapse 的 TypeScript 类型声明补充
└── AstroPaper-lighthouse-score.svg  # Lighthouse 性能评分徽章
```
