---
title: macOS Sierra及以上版本 打开任何来源
categories: MacOS
pubDatetime: 2019-10-18T10:36:41.000Z
description: macOS Sierra及以上版本 打开任何来源
tags:
  - MacOS
  - 任何来源
---

[macOS Sierra](https://support.apple.com/zh-cn/HT208202)及以上版本所有第三方应用都无法打开了，提示无法打开或者扔进废纸篓。这对于我这种用学习版的人来讲简直就是要了老命，本着学习的精神找到了开启方法，记录一下。

[macOS Sierra](https://support.apple.com/zh-cn/HT208202)之前的系统也是需要手动去打开应用程序-系统偏好设置-安全性和隐私-通用里勾选任何来源，这样操作之后才能打开第三方应用。而到了[macOS Sierra](https://support.apple.com/zh-cn/HT208202)同样如此，但是默认是不显示的。

我的系统版本：

<!--more-->

![系统版本](https://image.2077tech.com/uploads/big/41fc46036f67ce84bcb2e0f417437dbd.jpg)

## 开启方式

1. 打开应用程序-实用工具-终端；
2. 复制以下代码`sudo spctl --master-disable` ，注意是**两个-**。
3. 输入你的`root`密码。
4. 没有任何提示就是对的，尽情安装*xx 软件*吧。

> 当然，如果你不喜欢用终端输入命令的方式打开任何来源选项，你也可以通过另一种方法来打开第三方应用程序： 按住 Control 键并点按或右键点按该 app 的图标，点击打开即可出现“打开”选项*（没有测试过）*。
