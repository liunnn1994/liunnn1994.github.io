---
title: React 使用TypeScript时customize-cra配置别名无效的解决办法
categories: TypeScript
pubDatetime: 2019-11-13T10:57:23.000Z
description: React 使用TypeScript时customize-cra配置别名无效的解决办法
tags:
- TypeScript
- React
- customize-cra
---

想用`TypeScript`做一个个人的项目，结果在启动的时候就遇到了问题，[customize-cra](https://github.com/arackaf/customize-cra)配置路径别名的时候总是报错，网上搜的都是旧版的，官网也只有`JS`的配置。后来在[这个`issues`](https://github.com/facebook/create-react-app/issues/5645)下找到了答案，再这记录一下。



首先在根目录下新建`config-overrides.js`：

```javascript
//引入需要的组件
const {
  override,
  addWebpackAlias,
} = require('customize-cra');
```

<!--more-->

然后写入配置：

```javascript
const path = require('path');

module.exports = override(
  addWebpackAlias({
    // eslint-disable-next-line no-useless-computed-key
    ["@"]: path.resolve(__dirname, "src"),
  }),
);
```

网上的教程都到此为止。时机后面应该还有一步。

在根目录下新建`paths.json`*（叫什么名无所谓，和接下来的配置保持一致就行）*：

```javascript
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

然后在`tsconfig.json`里加入：

```javascript
"extends": "./paths.json"
```

重启项目

```javascript
import Hello from "@/components/Hello";
```

不再报错，配置成功。