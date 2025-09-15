---
title: 掌控你的智能家居 - homeassistant详细搭建教程
categories: homeassistant
pubDatetime: 2020-08-11T10:40:53.000Z
description: 掌控你的智能家居 - homeassistant详细搭建教程
tags:
- homeassistant
- 智能家居
---



# 前言

​	作为专业的`hello world`工程师，新装修房子肯定是要整一套智能家居的。虽然小米的智能家居方案已经很不错了，但是也没法100%的满足需求。而且各个厂商都有自己的生态系统，小米的小爱同学对应的是米家，苹果的`siri`对应的是`HomeKit`。想用`siri`控制非`HomeKit`的设备显然不可以，`HomeKit`解决方案的价格也不是我这种傲（穷）骨（人）可以玩得转的，所以为了实现各个厂商的互通就有了[home-assistant](https://github.com/home-assistant/core)这个项目。

# home-assistant

  具体的介绍就不多说了，简单来讲`home-assistant`是一个智能设备平台，它可以调度上千种智能设备*（截止到2020 08 11官方公布支持1622种）*，包括常见的*米家*，*Amazon Alexa*，*Google Assistant*，*Google Cast*，*宜家*等等，基本上覆盖了市面上所有常见的设备。具体列表可以在官网公布的[支持列表中](https://www.home-assistant.io/integrations)查看。

<!--more-->

# 准备工作

>  后面简称home-assistant为hass 

  首先需要准备一个可以运行`hass`系统的硬件，`hass`基于`python`，所以支持`windows`,`mac os`和`linux`各种发行版。作为需要*7x24*运行的系统`PC`肯定不行了，功耗太高，所以在这使用树莓派作为基础平台。树莓派的特点在这就不多说了，本次我购买的是*树莓派4B*。

## 树莓派系统

  树莓派本身有官方系统，不过网评一般，所以在这安装的是`Ubuntu 20.04.1 LTS`。之前找过一个[Debian-Pi-Aarch64 ★ 全新树莓派64位系统](https://github.com/openfans-community-offical/Debian-Pi-Aarch64)。性能很不错，就是系统依赖会有问题。树莓派的性能太低了，做点啥时间太长，所以放弃折腾直接使用官方的`Ubuntu 20.04`。

  系统的安装不多说了，下载镜像之后使用`Win32DiskImager`傻瓜式一键安装，唯一需要注意的是下载的系统是压缩包，记得把`img`镜像解压出来再安装。

## 连接WIFI

  不得不说第三方优化的就是方便，上面的`Debian-Pi-Aarch64`配置`wifi`极为方便。`ubuntu`的坑就是按照官方文档来还是失败，而且网上的都是老版本的配置方法。

  经过多次尝试总结了`Ubuntu 20.04`的WIFI配置方法：

1. 安装完系统后先用有线连接你的路由器。

2. 在路由器的管理界面找到树莓派的`IP`，如果你跟我一样安装的是`ubuntu 20`，那么路由器里的名称也应该叫`ubuntu`。

3. 找到树莓派的`IP`后使用`ssh`登陆，初始用户名和密码都是`ubuntu`。首次登录后需要设置一个新密码，然后使用新密码重新登陆一下。

4. 成功连接树莓派后就可以配置wifi了：

   1. 打开`/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg`文件

      ```shell
      sudo nano /etc/cloud/cloud.cfg.d/99-disable-network-config.cfg
      ```

   2. 把`network: {config: disabled}`写入到文件中，不用格式化。

   3. 创建`/etc/netplan/01-netcfg.yaml`文件并编辑：

      ```shell
      sudo nano /etc/netplan/01-netcfg.yaml
      ```

   4. 把wifi配置添加到上面的文件中：

      ```yaml
      network:
        version: 2
        renderer: networkd
        wifis:
          wlan0:
            dhcp4: true
            optional: true
            access-points: 
              "你的wifi名称":
                password: "wifi密码"
      ```

   5. 在这需要注意，如果你连接的是`5G wifi`的话记得对应树莓派支持的信道和路由器的信道，否则是连接不上的。

   6. 应用配置并重启

      ```shell
      # 如果配置有错误会在这一步提示出来
      sudo netplan generate
      # 这一步有可能会有systemctl的错误提示，忽略即可
      sudo netplan apply
      # 重启系统拔掉有线就连接上wifi了
      sudo reboot
      ```

# 环境配置

> 首先需要一些基础环境配置

  ### 切换`apt`的源为清华镜像：

```shell
sudo nano /etc/apt/sources.list
```

删除掉里面的所有内容，然后添加下面的内容：

```
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse

# 预发布软件源，不建议启用
# deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-proposed main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-proposed main restricted universe multiverse
```

  **如果你跟我一样使用的是树莓派或者其他`ARM`架构的硬件**则需要使用`ubuntu-ports`镜像，把地址替换为`https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/`

```
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb  https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/ focal main restricted universe multiverse
# deb-src  https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/ focal main restricted universe multiverse
deb  https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/ focal-updates main restricted universe multiverse
# deb-src  https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/ focal-updates main restricted universe multiverse
deb  https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/ focal-backports main restricted universe multiverse
# deb-src  https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/ focal-backports main restricted universe multiverse
deb  https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/ focal-security main restricted universe multiverse
# deb-src  https://mirrors.tuna.tsinghua.edu.cn/ubuntu-ports/ focal-security main restricted universe multiverse
```

### 安装前置依赖

  在这我们使用`pyenv`来管理`Python`，所以先安装一下前置依赖：

1. 更新`apt`

   ```shell
   sudo apt update && sudo apt upgrade
   ```

2. 安装依赖

   ```shell
   sudo apt-get install -y gcc make build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev
   ```

### 安装pyenv

> `pyenv`使您可以轻松地在多个版本的Python之间切换。它简单，简单，遵循UNIX的一站式工具传统。

可以按照官方的方法来[手动安装](https://github.com/pyenv/pyenv#installation)，同时官方提供了一键安装脚本：

```shell
curl https://pyenv.run | bash
```

一般会遇到`ssl`的问题，可以直接把脚本下载到本地来进行安装：

脚本地址：`https://github.com/pyenv/pyenv-installer/raw/master/bin/pyenv-installer`

运行：

```shell
bash pyenv-installer.sh
```

不要使用`sudo`。滥用权限有可能导致一系列问题。

等待脚本执行完成后把环境变量添加到系统中：

```shell
sudo nano ~/.bashrc
```

添加：

```
export PATH="/home/ubuntu/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
```

```
source ~/.bashrc
```

运行`pyenv version`查看`pyenv`版本。

运行`pyenv versions`查看本机`python`版本，注意这里多个`s`。

### 安装hass

  `pyenv`安装成功后我们就可以安装管理`python`了。

  `hass`需要`Pyrhon 3.7`及以上，实测`3.6`也可以，不过会提示失去支持。`3.8`版本依赖会报错，所以我们安装`Python 3.7.8`。

  如果对于你的网速有信心可以直接执行`pyenv install 3.7.8`。由于国内网络原因在这使用本地安装，首先使用各种方法去python官网下载`Python-3.7.8.tar.xz`，可以使用迅雷等`p2p`软件。然后把下载好的软件放到`~/.pyenv/cache`文件夹下，`cache`文件夹没有可以自己新建一个。然后执行`pyenv install 3.7.8`等待就可以了，期间没有安装进度，等待提示成功即可。

  `python`安装完成后就可以安装`hass`了。首先全局配置清华`pip`源：

```shell
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

升级`pip`

```shell
pip install pip -U
```

利用`venv `创建虚拟环境：

```shell
cd 任何想要的目录
python3 -m venv hass
```

进入虚拟环境并激活

```shell
cd hass
source bin/activate
```

安装`hass`

```shell
python3 -m pip install homeassistant
```

> 需要等待一段时间。。。

启动`hass`

```shell
hass
# 或者启动hass后打开web ui
hass --open-ui
```

第一次启动`hass`需要下载一些依赖，启动成功后在浏览器中打开地址即可：

**如果有宝塔之类的面板记得在防火墙中放行8123端口**

打开`http:你的ip:8123`

出现面板就是安装成功了，如果失败就再次执行`hass`

![hass面板](https://image.2077tech.com/uploads/big/6561675cacbf519abc774b7fba8c8158.png)

## 结语

到此`hass`就搭建完成了，已经完成了智能家居联动的最重要步骤，后面的添加使用等有时间再出教程吧。

