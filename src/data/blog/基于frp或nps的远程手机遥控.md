---
title: 基于frp或nps的远程遥控手机实现钉钉远程打卡
categories: 内网穿透
pubDatetime: 2020-04-24T11:39:01.000Z
description: 本文介绍了如何基于frp或nps实现远程遥控手机进行钉钉远程打卡。
tags:
- frp
- nps
- 内网穿透
- 远程遥控
- 安卓
- 钉钉
- 远程打卡
---

​		想要实现远程控制手机已知比较好的商业解决方案有`Teamviewer`和向日葵。不过价格对于我这种偶尔有需求的*穷逼*来讲确实不太合适。索性自己搭建一个。

​		对比网上的其他方案优点就是：

1. 直接控制手机，不光可以钉钉打卡，所有手机的操作都可以做。
2. 控制是基于`adb`的，不存在钉钉更新后插件失效的问题，也没有被检测的风险。
3. 一次搭建永久使用，不需要更新。
4. 用的都是`10K+`开源，不存在广告病毒之类的。

> `ADB`是什么？
>
> 全称*Android Debug Bridge*。安卓平台调试桥，是连接Android手机与PC端的桥梁，通过adb可以管理、操作模拟器和设备，如安装软件、查看设备软硬件参数、系统升级、运行shell命令等。

<!--more-->

​		理想状态是手机直接控制手机，就像`Teamviewer`或向日葵那样，但是找了好几天也没看到有人做这个，无奈只能折中一下使用电脑来控制了。

​		经过研究方案有两种，一种需要远程设备*（被控制端）*连接电脑，第二种就是控制端是电脑。

### 基于`frp`的方案

​		基本原理就是**控制端** *（手机，电脑，开发板等终端）*通过`frp`控制**被控制端** *（电脑，开发板等`windows`或`linux`系统的设备）*然后被控制端通过`adb`来控制手机。

#### 在服务器上搭建`frp`

1. 首先下载[frp](https://github.com/fatedier/frp)，在`release`中找到对应自己系统的版本。

2. 解压之后服务器需要的是`frps`和`frps.ini`，其他文件可以删掉了。

3. 编辑`frps.ini`:

   ```ini
   [common]
   # 绑定端口，根据自己的情况修改
   bind_port = 7000
   # 管理面板的端口，根据自己的情况修改
   dashboard_port = 7500
   # 管理面板的用户名，起一个别人猜不到的
   dashboard_user = admin
   # 管理面板的密码
   dashboard_pwd = 123456
   # 自定义token
   token = 123456
   ```

4. 之后直接启动就可以了`./frps -c ./frps.ini`

5. 在这我是用`pm2`来管理启动项：

   ```shell
   pm2 start -x './frps' -n frp -- -c ./frps.ini
   ```

#### 配置`frp`客户端

1. 还是下载对应系统的[frp](https://github.com/fatedier/frp)。我的客户端是`win 10 x64`的，所以下载[frp_0.32.1_windows_amd64.zip](https://github.com/fatedier/frp/releases/download/v0.32.1/frp_0.32.1_windows_amd64.zip)

2. 下载后解压，客户端需要的是`frpc.exe`和`frpc.ini`，其他不需要的可以删除了。

3. 编辑配置文件`frpc.ini`：

   ```ini
   [common]
   server_addr = 你的服务器ip
   # 上面配置的bind_port
   server_port = 7000
   # 上面配置的自定义token
   token=123456
   
   [给你的客户端起个名字，会显示在管理面板中]
   # 链接类型
   type = tcp
   # 本地ip
   local_ip = 127.0.0.1
   # 内网穿透的本地端口，因为需要使用windows远程桌面，所以填默认的3389，如果你修改过mstsc的端口那就按照修改的填写
   local_port = 3389
   # 远程端口
   remote_port = 7003
   ```

4. 配置好之后可以启动试试`frpc.exe -c ./frpc.ini`

   ![启动frp](https://image.2077tech.com/uploads/big/4963f3a4731d58fd7309f4ed1bb01797.png)

5. 可以写一个`bat`来一键启动：

   ```bat
   chcp 65001
   @echo. ******点击右上角关闭按钮或连续两次Ctrl+C关闭******
   frpc.exe -c ./frpc.ini
   pause
   ```

   

6. 启动成功后可以试着用其他设备控制这台电脑，`windows`直接启动`mstsc`，手机下载`RD Client`。利用你的服务器`ip`和上面设置的远程端口*（7003）*微软自家东西的配套做的还是非常良心的，**免费、好用**：

   ![windows远程桌面](https://image.2077tech.com/uploads/big/26009fd0b141a894f51ab6f55ebe5f66.png)

   6. 连接成功后就可以使用电脑控制手机了。
   7. 在这下载[scrcpy](https://github.com/Genymobile/scrcpy)，这是一个开源免费在电脑显示手机画面并控制手机的工具 (投屏/录屏/免Root)
   8. 如果你只有一个设备，直接双击`scrcpy.exe`就可以开始控制了，如果有多个设备则执行一下` .\adb.exe devices`找到你的设备，之后`.\scrcpy.exe -s 设备ID`就可控制了
   
   > 到这一步就可以实现远程控制了，但是如果远程的电脑关机了就不行了。实现远程关机很简单，到网上随便买个智能插座，然后把bios设置成通电自动开机就可以了。

### 基于`nps`的方案

​		上面基于`frp`的方案需要远程有电脑，有的人可能不方便，基于`nps`的可以免除远程的电脑。

原理和`frp`一样，都是内网穿透，因为`nps`提供安卓版本的，所以可以直接使用。

> nps是一款轻量级、高性能、功能强大的**内网穿透**代理服务器。目前支持**tcp、udp流量转发**，可支持任何**tcp、udp**上层协议（访问内网网站、本地支付接口调试、ssh访问、远程桌面，内网dns解析等等……），此外还**支持内网http代理、内网socks5代理**、**p2p等**，并带有功能强大的web管理端。

#### 在服务器上搭建`nps`

1. 根据你的系统下载[nps](https://github.com/ehang-io/nps)

2. 解压，执行`sudo ./nps install`来安装

3. `nps`默认配置文件使用了80，443，8080，8024端口

   80与443端口为域名解析模式默认端口

   8080为web管理访问端口

   8024为网桥端口，用于客户端与服务器通信

4. 服务器上肯定有其他项目，所以不能占用80和443等端口，在这修改`nps.conf`

   ```ini
   appname = nps
   #Boot mode(dev|pro)
   runmode = dev
   
   #HTTP(S) proxy port, no startup if empty
   http_proxy_ip=0.0.0.0
   http_proxy_port=8001
   https_proxy_port=8443
   https_just_proxy=true
   #default https certificate setting
   https_default_cert_file=conf/server.pem
   https_default_key_file=conf/server.key
   
   ##bridge
   bridge_type=tcp
   bridge_port=8024
   bridge_ip=0.0.0.0
   
   # Public password, which clients can use to connect to the server
   # After the connection, the server will be able to open relevant ports and parse related domain names according to its own configuration file.
   public_vkey=123
   
   #Traffic data persistence interval(minute)
   #Ignorance means no persistence
   #flow_store_interval=1
   
   # log level LevelEmergency->0  LevelAlert->1 LevelCritical->2 LevelError->3 LevelWarning->4 LevelNotice->5 LevelInformational->6 LevelDebug->7
   log_level=7
   #log_path=nps.log
   
   #Whether to restrict IP access, true or false or ignore
   #ip_limit=true
   
   #p2p
   #p2p_ip=127.0.0.1
   #p2p_port=6000
   
   #web
   web_host=a.o.com
   web_username=你的用户名
   web_password=你的密码
   web_port = 7501
   web_ip=0.0.0.0
   web_base_url=
   web_open_ssl=false
   web_cert_file=conf/server.pem
   web_key_file=conf/server.key
   # if web under proxy use sub path. like http://host/nps need this.
   #web_base_url=/nps
   
   #Web API unauthenticated IP address(the len of auth_crypt_key must be 16)
   #Remove comments if needed
   #auth_key=test
   auth_crypt_key =1234567812345678
   
   #allow_ports=9001-9009,10001,11000-12000
   
   #Web management multi-user login
   allow_user_login=false
   allow_user_register=false
   allow_user_change_username=false
   
   
   #extension
   allow_flow_limit=false
   allow_rate_limit=false
   allow_tunnel_num_limit=false
   allow_local_proxy=false
   allow_connection_num_limit=false
   allow_multi_ip=false
   system_info_display=false
   
   #cache
   http_cache=false
   http_cache_length=100
   
   #get origin ip
   http_add_origin_header=false
   
   #pprof debug options
   #pprof_ip=0.0.0.0
   #pprof_port=9999
   ```
   
5. 启动`nps`

    `sudo nps start`。

   然后访问`http://你的ip:7501/`，看到管理界面就是成功了。

6. 然后再面板上新增一个客户端，之后在`TCP隧道`中配置内网穿透：

   模式：`TCP`隧道

   服务端端口：7111*（根据自己情况填写）*

   目标 (IP:端口)：5555 *（`adb`的远程调试端口）*

7. 之后安装安卓版的`nps`，填写你的**服务器ip:端口**和刚才配置的**唯一验证密钥**

8. 之后在你的控制端*（比如你家里的电脑）*打开[scrcpy](https://github.com/Genymobile/scrcpy)，执行：

   ```shell
   .\scrcpy.exe -s 服务器IP:7004
   ```

9. 现在你就可以成功在家控制在单位的手机了。

> 这种方案免除了**被控制端**的电脑，也就是被控制端*（比如单位）*只有一部手机就可以了，而且也不需要买智能插座了。
>
> 缺点就是软件是直接运行在手机上的，某些系统会自动把进程杀掉，如果后台被清理了那就没办法了。



### 总结

​		`frp`的方案是远程控制你的电脑，然后通过远程的电脑控制远程的手机。控制端可以使电脑，手机等各种设备。

​		`nps`是直接控制远程的手机，但是控制端只能是电脑，而且被控制端可能存在杀后台等情况。

​		两种方法各有利弊，大家可以根据自己的情况进行选择。



