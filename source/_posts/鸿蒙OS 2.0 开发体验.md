---
title: 鸿蒙OS 2.0 开发体验
categories: 鸿蒙OS
date: 2020/09/11 18:38:22
tags:
- 鸿蒙OS
- 安卓
- uni
---


​    昨天（北京时间 2020年9月10日）华为鸿蒙OS 2.0正式发布，预计明年华为手机全面支持。同时公布了面向开发者的BATE版。

​	看了一下[文档](https://developer.harmonyos.com/cn/documentation)，同时支持`java`和`js`。那必须整一个试试。

# 安装 IDE

​	首先去官网下载[HUAWEI DevEco Studio](https://developer.harmonyos.com/cn/develop/deveco-studio#download)，目前只有`windows`版。下载后解压安装。![HUAWEI DevEco Studio](https://image.2077tech.com/uploads/big/65e9901ff9b1e7feaddd7e66d7d4761e.png)

<!--more-->

> jetbrains家的社区版，有那味了。

​	安装后直接启动：

![ide](https://image.2077tech.com/uploads/big/b0ec577e768bc4bfa7f4217cb3a9f945.jpg)

​	因为都是*jetbrains家*的开源版，所以和`android studio`基本一致。启动后发现现在只支持电视和可穿戴设备的模板，除了`Lite`都提供了`java`和`js`的模板。在这我们新建一个可穿戴设备的模板：

![新建模板](https://image.2077tech.com/uploads/big/5a989771888d05ffa6101a283f3c2141.png)

​	目录结构如下：

```
.
└── HWDemo
    ├── HWDemo.iml
    ├── build
    │   └── outputs
    │       └── hap
    │           └── debug
    │               └── tv
    │                   └── entry-debug-unsigned.hap
    ├── build.gradle
    ├── entry
    │   ├── build
    │   │   ├── generated
    │   │   │   └── source
    │   │   │       └── r
    │   │   │           └── ResourceTable.java
    │   │   ├── intermediates
    │   │   │   ├── dex
    │   │   │   │   └── debug
    │   │   │   │       └── classes.dex
    │   │   │   ├── external_libs
    │   │   │   │   └── debug
    │   │   │   │       ├── compile_libs_file.index
    │   │   │   │       └── package_libs_file.index
    │   │   │   ├── javac
    │   │   │   │   └── debug
    │   │   │   │       ├── classes
    │   │   │   │       │   ├── META-INF
    │   │   │   │       │   │   └── MANIFEST.MF
    │   │   │   │       │   ├── classes.jar
    │   │   │   │       │   └── com
    │   │   │   │       │       └── example
    │   │   │   │       │           └── hwdemo
    │   │   │   │       │               ├── HWDemo.class
    │   │   │   │       │               ├── MainAbility.class
    │   │   │   │       │               └── ResourceTable.class
    │   │   │   │       └── java_file.index
    │   │   │   ├── merge_profile
    │   │   │   │   └── debug
    │   │   │   │       └── config.json
    │   │   │   ├── merge_res
    │   │   │   │   └── debug
    │   │   │   │       ├── merge_res_file.index
    │   │   │   │       └── original_res
    │   │   │   │           └── res
    │   │   │   │               ├── drawable
    │   │   │   │               │   └── icon.png
    │   │   │   │               └── values
    │   │   │   │                   └── strings.xml
    │   │   │   ├── res
    │   │   │   │   └── debug
    │   │   │   │       ├── jsManifest
    │   │   │   │       │   └── default
    │   │   │   │       │       └── manifest.json
    │   │   │   │       ├── jsResources
    │   │   │   │       │   ├── base
    │   │   │   │       │   │   ├── element
    │   │   │   │       │   │   └── media
    │   │   │   │       │   │       └── icon.png
    │   │   │   │       │   └── rawfile
    │   │   │   │       └── rich
    │   │   │   │           ├── R.txt
    │   │   │   │           ├── assets
    │   │   │   │           │   └── js
    │   │   │   │           │       └── default
    │   │   │   │           │           ├── app.bin
    │   │   │   │           │           ├── app.js
    │   │   │   │           │           ├── app.js.map
    │   │   │   │           │           ├── common
    │   │   │   │           │           │   ├── img-large.png
    │   │   │   │           │           │   ├── img-small.png
    │   │   │   │           │           │   ├── logo.png
    │   │   │   │           │           │   ├── plus-black.png
    │   │   │   │           │           │   └── plus-white.png
    │   │   │   │           │           ├── i18n
    │   │   │   │           │           │   ├── en-US.json
    │   │   │   │           │           │   └── zh-CN.json
    │   │   │   │           │           ├── manifest.json
    │   │   │   │           │           └── pages
    │   │   │   │           │               └── index
    │   │   │   │           │                   ├── index.bin
    │   │   │   │           │                   ├── index.js
    │   │   │   │           │                   └── index.js.map
    │   │   │   │           ├── config.json
    │   │   │   │           ├── resources
    │   │   │   │           │   ├── base
    │   │   │   │           │   │   └── media
    │   │   │   │           │   │       ├── attributes.key
    │   │   │   │           │   │       ├── constants.key
    │   │   │   │           │   │       ├── contents.key
    │   │   │   │           │   │       ├── icon.png
    │   │   │   │           │   │       └── nodes.key
    │   │   │   │           │   └── rawfile
    │   │   │   │           └── resources.index
    │   │   │   ├── shell
    │   │   │   │   ├── build
    │   │   │   │   │   ├── dex
    │   │   │   │   │   │   └── debug
    │   │   │   │   │   │       └── classes.dex
    │   │   │   │   │   ├── javac
    │   │   │   │   │   │   └── debug
    │   │   │   │   │   │       ├── classes
    │   │   │   │   │   │       │   └── com
    │   │   │   │   │   │       │       └── example
    │   │   │   │   │   │       │           └── hwdemo
    │   │   │   │   │   │       │               ├── MainAbilityShellActivity.class
    │   │   │   │   │   │       │               ├── R$drawable.class
    │   │   │   │   │   │       │               ├── R$string.class
    │   │   │   │   │   │       │               ├── R.class
    │   │   │   │   │   │       │               └── ShellHWDemo.class
    │   │   │   │   │   │       ├── classes.jar
    │   │   │   │   │   │       └── index.txt
    │   │   │   │   │   ├── mergedManifest
    │   │   │   │   │   │   └── debug
    │   │   │   │   │   │       └── AndroidManifest.xml
    │   │   │   │   │   ├── res
    │   │   │   │   │   │   └── debug
    │   │   │   │   │   │       ├── cut_entry
    │   │   │   │   │   │       │   ├── AndroidManifest.xml
    │   │   │   │   │   │       │   ├── classes.dex
    │   │   │   │   │   │       │   ├── res
    │   │   │   │   │   │       │   │   └── drawable
    │   │   │   │   │   │       │   │       └── icon.png
    │   │   │   │   │   │       │   └── resources.arsc
    │   │   │   │   │   │       ├── cut_entry.zip
    │   │   │   │   │   │       ├── entry
    │   │   │   │   │   │       │   ├── AndroidManifest.xml
    │   │   │   │   │   │       │   ├── classes.dex
    │   │   │   │   │   │       │   ├── res
    │   │   │   │   │   │       │   │   └── drawable
    │   │   │   │   │   │       │   │       └── icon.png
    │   │   │   │   │   │       │   └── resources.arsc
    │   │   │   │   │   │       ├── entry.zip
    │   │   │   │   │   │       ├── r
    │   │   │   │   │   │       │   └── com
    │   │   │   │   │   │       │       └── example
    │   │   │   │   │   │       │           └── hwdemo
    │   │   │   │   │   │       │               └── R.java
    │   │   │   │   │   │       └── res.zip
    │   │   │   │   │   └── simplifyManifest
    │   │   │   │   │       └── AndroidManifest.xml
    │   │   │   │   └── src
    │   │   │   │       └── main
    │   │   │   │           ├── AndroidManifest.xml
    │   │   │   │           ├── java
    │   │   │   │           │   └── com
    │   │   │   │           │       └── example
    │   │   │   │           │           └── hwdemo
    │   │   │   │           │               ├── MainAbilityShellActivity.java
    │   │   │   │           │               └── ShellHWDemo.java
    │   │   │   │           └── res
    │   │   │   │               ├── drawable
    │   │   │   │               │   └── icon.png
    │   │   │   │               └── values
    │   │   │   │                   └── strings.xml
    │   │   │   └── shell_output
    │   │   │       └── debug
    │   │   │           ├── cut
    │   │   │           │   └── entry_unsigned_cut_entry.apk
    │   │   │           ├── entry_signed_entry.apk
    │   │   │           └── entry_unsigned_entry.apk
    │   │   └── outputs
    │   │       └── hap
    │   │           └── debug
    │   │               ├── entry-debug-unsigned.hap
    │   │               └── hapInfo.json
    │   ├── build.gradle
    │   ├── entry.iml
    │   ├── libs
    │   ├── node_modules
    │   ├── package.json
    │   └── src
    │       ├── main
    │       │   ├── config.json
    │       │   ├── java
    │       │   │   └── com
    │       │   │       └── example
    │       │   │           └── hwdemo
    │       │   │               ├── HWDemo.java
    │       │   │               └── MainAbility.java
    │       │   ├── js
    │       │   │   └── default
    │       │   │       ├── app.js
    │       │   │       ├── common
    │       │   │       │   ├── img-large.png
    │       │   │       │   ├── img-small.png
    │       │   │       │   ├── logo.png
    │       │   │       │   ├── plus-black.png
    │       │   │       │   └── plus-white.png
    │       │   │       ├── i18n
    │       │   │       │   ├── en-US.json
    │       │   │       │   └── zh-CN.json
    │       │   │       └── pages
    │       │   │           └── index
    │       │   │               ├── index.css
    │       │   │               ├── index.hml
    │       │   │               └── index.js
    │       │   └── resources
    │       │       ├── base
    │       │       │   ├── element
    │       │       │   │   └── string.json
    │       │       │   └── media
    │       │       │       └── icon.png
    │       │       └── rawfile
    │       └── test
    │           └── java
    │               └── com
    │                   └── example
    │                       └── hwdemo
    │                           └── MainAbilityTest.java
    ├── gradle
    │   └── wrapper
    │       ├── gradle-wrapper.jar
    │       └── gradle-wrapper.properties
    ├── gradle.properties
    ├── gradlew
    ├── gradlew.bat
    ├── local.properties
    ├── settings.gradle
    └── tree.txt

118 directories, 101 files
```

​	新建项目后需要等待安装`SDK`，在这不得不吐槽一下，都是`huawei.com`的地址了速度居然慢到爆炸，挂了代理速度才上来，`ping`了一下是北京华为云的服务器，真是实力劝退。

![下载依赖](https://image.2077tech.com/uploads/big/dfc931fb2cc007f291a01baf6da767f3.png)

​	等待结束后就可以下一步了。

# 开启虚拟机

​	在菜单中选中`Tools>HVD Manager`首次开启需要下载资源。下载成功后点击`Refresh`会在浏览器中弹出登陆页面。

> 如果你没注册过华为的开发者账号那就打开`Chrome`的无痕窗口或者其他浏览器进行实名注册。这一步的原因是他这个验证有BUG，会一直跳转实名注册》验证成功》登陆成功》没了？？？

​	在这还得吐槽一下，实名认证你要我银行卡号干什么？要给我打钱吗？

​	登陆成功后就会刷新出列表，只有两个机器，一个是`TV`的一个是可穿戴设备的。在这我们选择可穿戴设备的虚拟机。

# Hello World

​	虚拟机开启后新建的模板自带一个`Hello World`的`Demo`。`js`开发相关的文件在`项目目录/entry/src/main/js`里面，修改`entry/src/main/js/default/pages/index`下的`hml`,`css`,`js`文件并重新运行就可以看见效果了。

​	在安装依赖的时候发现了`uni`相关的内容。而且点击运行就可以出现效果，估计`js`开发的内容也是运行在`webview`里的。![uni？？？](https://image.2077tech.com/uploads/big/9ffe4ee79fff4b58d6ddea67fac1fd80.png)

# 体验

​	没啥好说的，做开发的都明白。反正`Linux`是开源的`Android`也是开源的，基于`Linux`是系统基于`Android`的当然也可以叫系统（OS）。别的不说，营销是真恶心。

​	一波体验下来`Flutter`恐成最大赢家。最大输家应该就是华为云了，真是实力劝退🐶。

​	希望鸿蒙能做起来，这样又有新饭恰了。

​	不说了，学`Dart`去了。