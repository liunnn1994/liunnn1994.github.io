---
title: 听说要干掉node.js？用Deno实现价值上亿的AI核心算法试一下
categories: Deno
pubDatetime: 2020-05-14T10:45:01.000Z
description: 听说要干掉node.js？用Deno实现价值上亿的AI核心算法试一下
tags:
- javascript
- typescript
- Deno
---

### `Deno`

他来了来了，他带着成吨的知识走来了

![Deno](https://image.2077tech.com/uploads/big/d338d628d7984c7c909ede67387f83a4.png)

`Deno`的1.0版本出来以后可以预见一大波的：

- 学不动了
- 再不学就被淘汰了
- `Deno`的`xx`实现原理
- `PHP`最牛逼

......

<!--more-->

### 创造`Deno`的原因

​    `Deno `是 `Ryan Dahl` 在2017年创立的。这位巨佬同时也是 `Node.js `的创始人，从2007年一直到2012年，他后来把` Node.js` 移交给了其他开发者之后，就跑去搞研究人工智能了。但是相传他不是很喜欢 `Python`，所以时间久了就想搞一个 `JavaScript `的人工智能开发框架。等到他再回过头捡起 `Node.js`，发现这个项目已经背离了他的初衷，有一些无法忽视的问题。

​    巨佬的说法是：

> But why!? Isn't this exactly what Node does? 
> JavaScript & the web have changed significantly since Node was designed in 2009: 
>
> - Promises. async functions
>
>  Async iterators/generatos 
>
> - ES Modules 
>
> - Typed Arrays 
>   Node has problems: 
>
> - Problems with its module system. with centralized distribution 
> - Lots of legacy APIs that must be supported
> -  No security model 
> - An explosion of tooling (grunt, gulp, webpack, babel, parcel, typescript, is-node, ...) 

​    简单来说`ES6 `标准引入了大量新的语法特性。其中，影响最大的语法有两个：`Promise `接口（以及 `async `函数）和 `ES `模块。`Node.js` 对这两个新语法的支持，都不理想。由于历史原因，`Node.js `必须支持回调函数`（callback）`，导致异步接口会有 `Promise `和回调函数两种写法；同时，`Node.js` 自己的模块格式 `CommonJS `与 `ES `模块不兼容，导致迟迟无法完全支持 `ES `模块。

​    其次就是众所周知的`npm`问题:)![npm](https://image.2077tech.com/uploads/big/8b481878ba5420814db2e2bcca9635ca.jpg)

​    再次，`Node.js `的功能也不完整，导致外部工具层出不穷，初始化一个项目先来一吨依赖：`webpack`，`babel`，`typescript`、`eslint`、`prettier`......

​    由于上面这些原因，巨佬决定放弃 `Node.js`，从头写一个替代品，彻底解决这些问题。`deno `这个名字就是来自 `Node `的字母重新组合，表示"拆除` Node.js`"`（de = destroy, no = Node.js）`。

    ##### 根据[官网](https://deno.land/)的说明：

​    `Deno`是使用`V8`并内置于`Rust`的`JavaScript`和`TypeScript`的简单，现代且安全的运行时。

1. 默认为安全。除非明确启用，否则没有文件，网络或环境访问权限。
2. 开箱即用地支持`TypeScript`。
3. 仅发送一个可执行文件。
4. 具有内置的实用程序，例如依赖项检查器`（deno info）`和代码格式化程序`（deno fmt）`。
5. 拥有一组保证能与[Deno](https://deno.land/std)一起使用的经过审查（审核）的标准模块：[deno.land/std](https://deno.land/std)

### 安装

​    `Deno`与`Node.js`不同的是`Deno`只有一个可执行文件，所有操作都通过这个文件完成，同时也是跨平台的。所以可以直接在[`GitHub release`](https://github.com/denoland/deno/releases)上下载对系统的二进制文件或利用官方提供的脚本进行下载安装：

使用 `PowerShell`:

```bash
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

使用 `Chocolatey`:

```bash
choco install deno
```

使用 `Scoop`:

```bash
scoop install deno
```

**注意**

​    `Deno` 具有安全控制，默认情况下脚本不具有读写权限。如果脚本未授权，就读写文件系统或网络，会报错。必须使用参数，显式打开权限才可以。

​    `Deno `只支持 ES 模块，跟浏览器的模块加载规则一致。没有 `npm`，没有 `npm_modules `目录，没有`require()`命令（即不支持 `CommonJS `模块），也不需要`package.json`文件。

​    所有模块通过 URL 加载，比如`import { bar } from "https://foo.com/bar.ts"`（绝对 URL）或`import { bar } from './foo/bar.ts'`（相对 URL）。因此，`Deno `不需要一个中心化的模块储存系统，可以从任何地方加载模块。

​    但是，`Deno `下载模块以后，依然会有一个总的目录，在本地缓存模块，因此可以离线使用。

​    首先可以尝试官方的`Hello world`：

```shell
deno run https://deno.land/std/examples/welcome.ts
```

会输出：`Welcome to Deno 🦕`

   尝试创建一个简单的`http server`：

   新建`hello world.ts` ，写入内容：

```typescript
import { serve } from "https://deno.land/std@0.50.0/http/server.ts";
const s = serve({ port: 1927 });
console.log("http://localhost:1927/");
for await (const req of s) {
  req.respond({ body: "Hello World\n" });
}
```

如果直接像`node`一样去执行：

```shell
deno run .\welcome.ts
```

那么会得到一个错误：

```shell
error: Uncaught PermissionDenied: network access to "0.0.0.0:1927", run again with the --allow-net flag
    at unwrapResponse ($deno$/ops/dispatch_json.ts:43:11)
    at Object.sendSync ($deno$/ops/dispatch_json.ts:72:10)
    at Object.listen ($deno$/ops/net.ts:51:10)
    at listen ($deno$/net.ts:152:22)
    at serve (https://deno.land/std@0.50.0/http/server.ts:261:20)
    at file:jiu bu gei ni kan
```

因为 `Deno` 的安全限制这里需要加上参数`--allow-net`允许脚本联网：

```shell
deno run --allow-net .\welcome.ts
```

打开[http://localhost:1927/](http://localhost:1927/)你会看到熟悉的`Hello World!`

### 利用`Deno`实现上亿的`Ai`算法

​    我知道你进来就是馋我的算法，以后靠这个融到资了别忘了请我喝冰阔落。

1. 首先新建一个`index.html`作为展示用

内容：

```html
<dl></dl>
<textarea id="msg" rows="10"></textarea>
<button>发送</button>
```

加上点样式是我对`UI`最后的倔强：

```css
textarea,
dl {
    width: 300px;
}
dl {
    height: 400px;
    border: 1px solid #000;
    overflow: hidden auto;
}
dd {
    margin-inline-start: 50%;
    background-color: #9eea6a;
    border: 1px solid #9eea6a;
}
dt {
    width: 50%;
    border: 1px solid #e7e7e7;
}
dd,
dt {
    margin-top: 10px;
    margin-bottom: 10px;
    border-radius: 2px;
    padding: 0 3px;
}
```

实现简单的逻辑：

> 点击发送与炒鸡AI进行对话

```javascript
const msgDom = document.querySelector("#msg");
const dl = document.querySelector("dl");
document.querySelector("button").addEventListener("click", () => {
    const { value } = msgDom;
    const dd = document.createElement("dd");
    dd.innerText = value;
    dl.appendChild(dd);
    msgDom.value = "";
    fetch("http://localhost:1927/ask", {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ msg: value }),
    })
        .then((res) => res.json())
        .then((data) => {
        const dt = document.createElement("dt");
        dt.innerText = data.msg;
        dl.appendChild(dt);
    });
});
```

2. 新建`server.ts`作为后端：

引入`server`和`router`

```typescript
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
```

设置编码格式：

```typescript
const decoder = new TextDecoder("utf-8");
```

读取`index.html`作为模板：

```typescript
const body = decoder.decode(await Deno.readFile("./index.html"));
```

> 在这可以看到`Deno`异步返回的都是`Promise`，并且允许在`async`外使用`await`。

新建服务：

```typescript
const app = new Application();
const router = new Router();
```

对于不同路由进行处理：

- 首页直接加载`index.html`

  ```typescript
  router
    .get("/", ({ response }) => {
      response.body = body;
    })
  ```

- 实现价值上亿的自然语言处理：

  ```typescript
  post("/ask", async ({ response, request }) => {
      const { value } = await request.body();
      response.body = JSON.stringify({
          msg: value.msg.replace(/(吗|我|？|\?)/gi, (str: string) => {
              if (/(吗|么)/.test(str)) {
                  return "";
              } else if (/(？|\?)/.test(str)) {
                  return "！";
              } else if (str === "我") {
                  return "你";
              }
          }),
      });
  });
  ```

应用路由并：

```typescript
app.use(router.routes());
await app.listen(`localhost:1927`);
```

启动脚本：

> 在这注意，因为用到了读取文件的功能，所以需要显示的指定允许`Deno`读物文件，添加启动参数`--allow-read`

```shell
# 允许网络以及文件读取权限
deno run --allow-net --allow-read .\server.ts
```

在页面中打开[http://localhost:1927/](http://localhost:1927/)查看效果：

![运行效果](https://image.2077tech.com/uploads/big/67e6ec223505f76f699c1ed506bfc1b1.gif)

### 个人感受

​    相对`Node.js`来讲作为前端使用起来没有太大区别，至于该不该使用`Ryan Dahl` 已经把主要的优缺点都讲了。其实最主要的问题就是生态可不可以建立起来，如果社区的生态建立出来了到时候不用也得用了。

![社区](https://image.2077tech.com/uploads/big/bb384c3f78dfa203b15c25983c63d5c4.jpg)

​    `Deno`本身是`Ryan Dahl` 想替代`Python`而制作的，希望`JavaScript`可以蚕食`Python`在`AI`的份额，切图仔摇身一变变成调参仔，想到自己以后有可能成为一名 *人工智能开发工程师* 真是吹牛逼都有劲了:)。