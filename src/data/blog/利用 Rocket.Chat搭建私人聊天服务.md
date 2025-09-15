---
title: Rocket.Chat docker搭建私人/团队聊天教程
categories: 自建服务
pubDatetime: 2020-03-13T17:18:49.000Z
description: 本文介绍了如何使用Rocket.Chat和Docker搭建私人或团队聊天服务。
tags:
- Rocket.Chat
- 私人聊天服务
- 团队聊天服务
- ubuntu
- docker
---
​		双十一买的良心云不知道做点什么，看到有人在[v2ex](https://www.v2ex.com/t/652713)上问哪个开源聊天好，索性也搭一个玩玩。在这使用的是[rocket.chat](https://rocket.chat/)。

​		我的地址是[https://chat.2077tech.com/channel](https://chat.2077tech.com/channel/general)，可以先看一看效果。

​		首先我的服务器是`Ubuntu 18`，但是没有使用`snap`。为了方便管理使用`Docker`来搭建。

首先更新一下系统

```shell
sudo apt update && sudo apt upgrade
```
<!--more-->
然后安装 [Docker](https://docs.docker.com/install)和 [Docker-compose](https://docs.docker.com/compose/install/)。

由于我的`docker`是使用管理员权限安装的，所以下面有关`docker`的操作全都加上了`sudo`。正常是不需要的。

`docker`安装完成之后配置一下国内的镜像：

```shell
sudo nano /etc/docker/daemon.json
```

写下内容：

```json
{
  "registry-mirrors": [
    "https://你申请的链接.mirror.aliyuncs.com",
    "http://docker.mirrors.ustc.edu.cn",
    "http://hub-mirror.c.163.com"
  ],
  "debug": true,
  "experimental": true
}
```

阿里云的`docker`镜像需要自己申请一下，免费的。

配置好国内镜像后下载`image`也会出现非常慢或者失败的情况，我对`docker`不太了解，估计是内部地址的问题。我的解决方案就是配置[v2ray](https://github.com/v2ray/v2ray-core)，秒下。如果没有条件的话就只能等了。

之后下载官方提供的`Docker-compose` ：

```shell
cd 你的目录
curl -L https://raw.githubusercontent.com/RocketChat/Rocket.Chat/develop/docker-compose.yml -o docker-compose.yml
```

或者可以参考我的配置：

```shell
sudo nano ./docker-compose.yml
```

写入内容：

```yaml
version: "2"

services:
  rocketchat:
    image: rocket.chat:latest
    command: bash -c 'for i in `seq 1 30`; do node main.js && s=$$? && break || s=$$?; echo "Tried $$i times. Waiting 5 secs..."; sleep 5; done; (exit $$s)'
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
    environment:
      - PORT=3000
      - ROOT_URL=http://chat.2077tech.com
      - MONGO_URL=mongodb://mongo:27017/rocketchat
      - MONGO_OPLOG_URL=mongodb://mongo:27017/local
      - Accounts_UseDNSDomainCheck=True
    depends_on:
      - mongo
    ports:
      - 4955:3000

  mongo:
    image: mongo:4.0
    restart: unless-stopped
    volumes:
      - ./data/db:/data/db
      - ./data/dump:/dump
    command: mongod --smallfiles --oplogSize 128 --replSet rs0 --storageEngine=mmapv1

  # this container's job is just run the command to initialize the replica set.
  # it will run the command and remove himself (it will not stay running)
  mongo-init-replica:
    image: mongo
    command: 'bash -c "for i in `seq 1 30`; do mongo mongo/rocketchat --eval \"rs.initiate({ _id: ''rs0'', members: [ { _id: 0, host: ''localhost:27017'' } ]})\" && s=$$? && break || s=$$?; echo \"Tried $$i times. Waiting 5 secs...\"; sleep 5; done; (exit $$s)"'
    depends_on:
      - mongo

  # hubot, the popular chatbot (add the bot user first and change the password before starting this image)
  hubot:
    image: rocketchat/hubot-rocketchat:latest
    restart: unless-stopped
    environment:
      - ROCKETCHAT_URL=服务器地址:端口号
      - ROCKETCHAT_ROOM=GENERAL
      - ROCKETCHAT_USER=你的自定义用户名
      - ROCKETCHAT_PASSWORD=你的自定义密码
      - BOT_NAME=机器人名称
      # you can add more scripts as you'd like here, they need to be installable by npm
      - EXTERNAL_SCRIPTS=hubot-help,hubot-seen,hubot-links,hubot-diagnostics
    depends_on:
      - rocketchat
    volumes:
      - ./scripts:/home/hubot/scripts
    # this is used to expose the hubot port for notifications on the host on port 3001, e.g. for hubot-jenkins-notifier
    ports:
      - 4956:8080
```

开启`mongodb`服务：

```shell
sudo docker-compose up -d mongo
```

首次启动`mongo`时，还需要对其进行初始化，然后才能使用`Rocket.Chat`。 确保`mongo`处于运行状态，然后：

```shell
sudo docker-compose up -d mongo-init-replica
```

`Mongo`支持7 x 24的操作和实时备份。所以不需要太频繁地重新启动它。详细的可以查兰[参考文档](https://docs.mongodb.org/manual/)

`mongodb`已启动并正在运行之后：

```shell
sudo docker-compose up -d rocketchat
```

如果需要机器人的话接下来启动`hubot`（记得配置**ROCKETCHAT_USER** 和**ROCKETCHAT_PASSWORD**参数）：

```shell
sudo docker-compose up -d hubot
```

现在打开*http://服务器地址:端口号*就可以开始网页版的聊天了，手机版去各大商店下载`Rocket.Chat`的`App`就可以了。

接下来配置`https`，新建`nginx`配置文件：

```nginx
server
{
    listen 80;
	listen 443 ssl http2;
    server_name 你的地址;
    index index.php index.html index.htm default.php default.htm default.html;
    
    #SSL-START SSL相关配置，请勿删除或修改下一行带注释的404规则
    #error_page 404/404.html;
    ssl_certificate    证书路径
    ssl_certificate_key    证书key路径;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 180m;

    #SSL-END
    
    #ERROR-PAGE-START  错误页配置，可以注释、删除或修改
    #error_page 404 /404.html;
    #error_page 502 /502.html;
    #ERROR-PAGE-END
    
    #PHP-INFO-START  PHP引用配置，可以注释或修改
    include enable-php-00.conf;
    #PHP-INFO-END
    
    #REWRITE-START URL重写规则引用,修改后将导致面板设置的伪静态规则失效
    include /www/server/panel/vhost/rewrite/chat.2077tech.com.conf;
    #REWRITE-END
    location / {
		proxy_pass http://chat.2077tech.com:4955;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header Host $http_host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forward-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forward-Proto http;
		proxy_set_header X-Nginx-Proxy true;
		proxy_redirect off;
	}
    #禁止访问的文件或目录
    location ~ ^/(\.user.ini|\.htaccess|\.git|\.svn|\.project|LICENSE|README.md)
    {
        return 404;
    }
    
    #一键申请SSL证书验证目录相关设置
    location ~ \.well-known{
        allow all;
    }
    
    access_log  /www/wwwlogs/chat.2077tech.com.log;
    error_log  /www/wwwlogs/chat.2077tech.com.error.log;
}
```

> 如果访问不了，首先查看你的服务器防火墙是否允许端口通过，如果你安装了宝塔之类的面板也需要在安全里开启端口，并且云主机的厂商会有安全组策略，记得修改。

如果需要更新的话直接更新`Docker`的镜像就可以了：

```shell
sudo docker pull rocketchat/rocket.chat:develop
sudo docker-compose stop rocketchat
sudo docker-compose rm rocketchat
sudo docker-compose up -d rocketchat
```



