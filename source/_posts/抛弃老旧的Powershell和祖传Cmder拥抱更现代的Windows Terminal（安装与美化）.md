---
title: 抛弃老旧的Powershell和祖传Cmder拥抱更现代的Windows Terminal（安装与美化）
categories: Mac
date: 2020/5/21 18:23:12
tags:
- Powershell
- windows-terminal
---

  在2020年5月19日微软发布了[`Windows Terminal 1.0`](https://devblogs.microsoft.com/commandline/windows-terminal-1-0/)正式版。`powershell`也将在[2022年12月3日终止维护](https://docs.microsoft.com/zh-cn/powershell/scripting/powershell-support-lifecycle?view=powershell-7#powershell-releases-end-of-life)。`windows`的终端一直都被人诟病，样式巨丑，命令和其他平台不统一等等。终于，微软在 [announcement at Microsoft Build 2019](https://www.youtube.com/watch?v=8gw0rXPMMPE)上公布了全新开发的`Windows Terminal`，漂亮方便的同时还解决了开发方式存在差异的痛点。话不多说，先上效果图：

![预览图1](https://image.2077tech.com/uploads/big/a7dcb45d25a2274f4dad8a546dfda82e.png)

![预览图2](https://image.2077tech.com/uploads/big/4c066712c78529c297e588dc84eef485.png)

<!--more-->

### 安装

  安装方法很简单，在这提供两种安装方法：

1. 直接打开电脑自带的[[Microsoft Store](ms-windows-store://home)](ms-windows-store://home)，然后搜索`windows terminal`安装即可。
2. 当然由于*某些未知原因*，`Microsoft Store`总会显示无法连接，那么就可以在微软的[GitHub Release](https://github.com/microsoft/terminal/releases)里直接下载最新的安装包*（xxx.msixbundle）*。下载完成后直接双击安装就可以了。

### 启动

  `windows terminal`安装后的启动文件为`wt.exe`，所以可以在运行、地址栏或者其他终端内直接输入`wt`就可以打开。

  当然也可以把它加到右键菜单中方便使用：

首先新建一个文本文件，命名为`xxx.reg`，然后输入以下内容：

```reg
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\Directory\Background\shell\wt]
@="Windows terminal here"
"Icon"="ico文件路径"

[HKEY_CLASSES_ROOT\Directory\Background\shell\wt\command]
@="C:\\Users\\你的用户名\\AppData\\Local\\Microsoft\\WindowsApps\\wt.exe"
```

`@="Windows terminal here"`就是右键时显示的文字。

`Icon`就是右键菜单里的图标，可以在网上找一个喜欢的图标，或者可以直接使用[我的图标](https://blog.2077tech.com/files/wt.ico)。

最后需要注意的就是需要把**你的用户名**位置替换成你电脑的用户名。保存之后双击导入注册表就可以在右键菜单看到了。

右键菜单设置完以后有一个小问题就是默认打开的路径不是文件夹的路径，在这我们点击`windows terminal`的设置，会弹出一个`json`文件，在`profiles.defaults`中添加`"startingDirectory": "."`，如果你是使用`vs code`编辑的话会有自动提示。

### 美化

  默认样式虽然比`powershell`好很多但是也比较普通，同样我们可以通过设置来定制自己的主题，比如添加透明度或者毛玻璃效果。

e.g. ：

```json
{
    "background": "#282A36",
    "black": "#21222C",
    "blue": "#BD93F9",
    "brightBlack": "#6272A4",
    "brightBlue": "#D6ACFF",
    "brightCyan": "#A4FFFF",
    "brightGreen": "#69FF94",
    "brightPurple": "#FF92DF",
    "brightRed": "#FF6E6E",
    "brightWhite": "#FFFFFF",
    "brightYellow": "#FFFFA5",
    "cyan": "#8BE9FD",
    "foreground": "#F8F8F2",
    "green": "#50FA7B",
    "purple": "#FF79C6",
    "red": "#FF5555",
    "white": "#F8F8F2",
    "yellow": "#F1FA8C"
}
```

  当然如果你跟我一样，对于`UI`只停留在*好看不好看*的层次上，那么自己设计主题肯定是不靠谱，好在有大神帮忙解决了问题。

  首先打开[主题网站](https://atomcorp.github.io/themes/)，网站中提供了超多的现成主题进行选择，挑好之后直接点击`COPY THEME`，然后回到`seetings.json`，把复制的主题粘贴在`schemes`这个数组里，然后在`profiles.defaults`中添加`colorScheme:你的主题名字`即可。我使用的主题是`Homebrew-Dark`。配置文件为：

```json
{
    "name": "Homebrew",
    "black": "#000000",
    "red": "#990000",
    "green": "#00a600",
    "yellow": "#999900",
    "blue": "#0000b2",
    "purple": "#b200b2",
    "cyan": "#00a6b2",
    "white": "#bfbfbf",
    "brightBlack": "#666666",
    "brightRed": "#e50000",
    "brightGreen": "#00d900",
    "brightYellow": "#e5e500",
    "brightBlue": "#0000ff",
    "brightPurple": "#e500e5",
    "brightCyan": "#00e5e5",
    "brightWhite": "#e5e5e5",
    "background": "#000000",
    "foreground": "#00ff00"
}
```

最后添加透明度和毛玻璃效果即可，同样是在`profiles.defaults`中添加`"acrylicOpacity": 0.7,"useAcrylic": true,`，保存即可生效。

### 安装模块

  美化完成后就是功能的扩展了，想要把`wt`配置成`on-my-zsh`那样还需要安装几个扩展：

1. 首先以管理员方式启动`wt`，然后安装`posh-git`：

   ```shell
   Install-Module posh-git -Scope CurrentUser
   ```

   >  如果此前没有安装 `NuGet` 提供程序，则此时会提示安装 `NuGet`；如果此前没有开启执行任意脚本，此处也会提示执行脚本。如果没有权限执行脚本，可能需要先执行 `Set-ExecutionPolicy Bypass`。

2. 安装 `oh-my-posh`

   ```shell
   Install-Module oh-my-posh -Scope CurrentUser
   ```

   然后输入`Import-Module oh-my-posh`后发现`tab`自动补全等功能就可以使用了。

3. 如果你退出`wt`再打开会发现功能消失了，必须再次`import`才可以，所以在终端中输入`$profile `，每次启动`wt`的时候都会加载这个文件，所以直接在文件中添加`Import-Module oh-my-posh`即可。

4. 最后安装[需要的字体](https://github.com/powerline/fonts/releases)，下载解压后直接执行`install.ps1`会自动安装。然后在`profiles.defaults`中添加`"fontFace": "Anonymous Pro for Powerline"`即可。

##### 每次启动展示系统信息：

  截图中的功能也是一个插件[ScreenFetch ](https://github.com/KittyKatt/screenFetch)。

  安装方式同上：

```shell
Install-Module windows-screenfetch -Scope CurrentUser
```

选择<kbd>Y</kbd>或者<kbd>A</kbd>即可安装。

安装好后执行`screenfetch`，同样在`profile `文件中添加命令，每次启动就都可以执行。

  现在（2020.05.21）安装的`screenfetch`存在一个[BUG](https://github.com/JulianChow94/Windows-screenFetch/issues/14)，如果你的资源管理器中存在不可识别的盘符，那么会得到不能除0的报错，这个已经解决，但是没有发布，所以我们打开`GitHub`，把本地的`Data.psm1`内容替换为[GitHub上的Data.psm1](https://github.com/JulianChow94/Windows-screenFetch/blob/master/Data.psm1)的内容即可。

### 总结

  至此`Windows Terminal`安装美化完成，删除了祖传的`Cmder`还有点不舍呢。



