---
title: MAC上的Chrome 恢复白色主题
categories: Mac
date: 2019/8/8 05:59:51
tags:
- Mac
- Chrome
---

在新版的`Chrome`上会跟随`Mac`上的暗色主题也变成黑色的。但是网页设计全部都是白色的主题，所以在使用的时候看起来非常丑。

打开终端输入如下命令就可以恢复白色模式。**不需要修改`Mac`的主题。**
<!--more-->

```shell
defaults write com.google.Chrome NSRequiresAquaSystemAppearance -bool YES
```

