---
title: 小心你的数据！我在谷歌搜到了我的账号密码！解决方法之Bitwarden_rs搭建教程
categories: bitwarden
date: 2020/05/22 18:08:46
tags:
- Bitwarden
- 密码保护
---

### 密码泄露

  之前一直听说有各种沙雕公司明文储存你的账号密码，前几年还没当回事，但是现在各种网站，`App`都要求注册，数据也越来越重要。作为一个网络人一直用的是一个密码肯定不安全，而且在`TG`的社工机器人那查到了我的所有个人信息，包括密码这种敏感数据。同样今天我在谷歌成功搜到了我的账号密码，你没看错，我在**搜索引擎**中搜到了我的**账号密码**。

![密码检查](https://image.2077tech.com/uploads/big/571cdf22e2d8e0435bf641e0912dc502.png)

<!--more-->  

虽然给数据泄露的公司发了邮件，他们处理也很快，但是泄露都不知道是什么时候的事了，而且对于其中`QQ`邮箱的尝试登陆了几个试试，确实有的账号密码是正确的。![邮件往来](https://image.2077tech.com/uploads/big/94d8d4af32fa7429cf0ef478a0418dab.png)

  所有网站使用同一个密码就意味着但凡有任何一个网站被脱裤，那么黑客就可以拿着账号密码登陆任何没有二次验证的网站。于是为了解决这个问题就有了这篇教程。

### 解决方案

  每一个网站都生成独一无二的密码，网站+特定密码，比如优酷设置密码`yk123456`，微博设置`wb123456`。但是这么做第一比较容易破解，第二比较容易忘，比如建设银行的密码就可以有好几种写法`jsyh123456`,`jh123456`,`js123456`，容易把自己搞混。

  那么第二种解决方案就是软件生成随机的密码，让软件帮忙自动填入。现在的现代手机和浏览器都支持自动填充账号密码，那么需要解决的就是用哪款软件。市面上的这种软件有很多，经过筛选最后剩下两种：

1. `1Password`
2. `Bitwarden`

### 1Password

  商业化的软件保证稳定性，公司成立时间长有优秀的解决方案，界面好看，使用方便。唯一的缺点就是贵，虽然有利用家庭订购合购钻漏洞的，但是这种方案相当于把密码从可信任的公司交给了个人，省着点钱简直就是本末倒置。那么想我这种穷B就只能用第二种方案了。

### Bitwarden

  [Bitwarden](https://github.com/bitwarden)是一个开源的，全平台的密码管理解决方案。并且支持私有部署。功能上完全可以满足需求。

### 搭建教程

  `Bitwarden`本身是由[.NET Core 3.1 SDK](https://www.microsoft.com/net/download/core)开发的，并且使用[SQL Server 2017](https://docs.microsoft.com/en-us/sql/index)，这就导致了对服务器的要求有些高，后来发现了[bitwarden_rs](https://github.com/dani-garcia/bitwarden_rs)：

> 这是一个用`Rust`编写的`Bitwarden`服务器`API`实现，与`Bitwarden`客户端兼容。

`Bitwarden_rs`相对于官方版本对服务器的要求要底，但是对于大量用户来讲没有官方版的好。由于就是几个人用，所以在这我们使用的是[bitwarden_rs](https://github.com/dani-garcia/bitwarden_rs)。

1. 安装`Docker`和`Docker Compose`，网上教程太多了，就不在这赘述了。

2. 首先新建一个目录用来存放`Bitwarden`的数据

   ```bash
   mkdir /你的路径/bitwarden && cd /你的路径/bitwarden
   ```

3. 新建配置文件：

   ```bash
   sudo nano config.env
   ```

   并写入配置：

   ```
   SIGNUPS_ALLOWED=true
   INVITATIONS_ALLOWED=true
   DATABASE_URL=/data/bitwarden.db
   ROCKET_WORKERS=10
   WEB_VAULT_ENABLED=true
   ```

   配置文件：

   - `SIGNUPS_ALLOWED` 是否允许注册，在这我们先允许不然一会不能新建第一个用户。
   - `INVITATIONS_ALLOWED` 是否允许邀请注册。
   - `DATABASE_URL` 数据库地址，相对于配置文件的目录。
   - `ROCKET_WORKERS` 设置服务器使用几个线程。10 是默认值，你可以根据机器性能和个人需求适当调整。
   - `WEB_VAULT_ENABLED` 设置是否开启 Web 客户端。如果开启，可以通过访问你的域名来打开 Web 客户端，用户登录后即可通过网页管理密码。

   然后新建`docker`的描述文件：

   ```bash
   sudo nano docker-compose.yml
   ```

   写入配置文件：

   ```yaml
   version: '3'
   
   services:
     bitwarden:
       image: mprasil/bitwarden:latest
       container_name: bitwarden
       restart: always
       volumes:
         - ./data:/data
       env_file:
         - config.env
       ports:
         - "映射的端口:80"
   ```

4. 配置文件准备好后配置`nginx`反向代理到`http://localhost:映射的端口`。

5. 启动服务：

   ```bash
   docker-compose up -d
   ```

6. 启动成功后在浏览器中打开你的地址就可以访问到`Bitwarden`的`web`端。在页面中注册好账号后就可以使用了。如果你之前用过其他的密码管理工具`Bitwarden`同样支持导入。`Bitwarden`支持的格式基本覆盖了所有密码管理工具：

   <details> 
       <summary>支持格式</summary>
      - Bitwarden (json)
       <br>
      - Bitwarden (csv)
       <br>
      - LastPass (csv)
       <br>
      - Chrome (csv)
       <br>
      - Firefox (csv)
       <br>
      - KeePass 2 (xml)
       <br>
      - 1Password (1pif)
       <br>
      - Dashlane (json)
       <br>
      - 1Password 6 and 7 Windows (csv)
       <br>
      - Ascendo DataVault (csv)
       <br>
      - Avast Passwords (csv)
       <br>
      - Avira (csv)
       <br>
      - Blur (csv)
       <br>
      - Clipperz (html)
       <br>
      - Enpass (csv)
       <br>
      - Enpass (json)
       <br>
      - F-Secure KEY (fsk)
       <br>
      - GNOME Passwords and Keys/Seahorse (json)
       <br>
      - Kaspersky Password Manager (txt)
       <br>
      - KeePassX (csv)
       <br>
      - Keeper (csv)
       <br>
      - Meldium (csv)
       <br>
      - mSecure (csv)
       <br>
      - Myki (csv)
       <br>
      - Opera (csv)
       <br>
      - Padlock (csv)
       <br>
      - Passbolt (csv)
       <br>
      - PassKeep (csv)
       <br>
      - Passman (json)
       <br>
      - Passpack (csv)
       <br>
      - Password Agent (csv)
       <br>
      - Password Boss (json)
       <br>
      - Password Dragon (xml)
       <br>
      - Password Safe (xml)
       <br>
      - PasswordWallet (txt)
       <br>
      - RememBear (csv)
       <br>
      - RoboForm (csv)
       <br>
      - SafeInCloud (xml)
       <br>
      - SaferPass (csv)
       <br>
      - SplashID (csv)
       <br>
      - Sticky Password (xml)
       <br>
      - True Key (csv)
       <br>
      - Universal Password Manager (csv)
       <br>
      - Vivaldi (csv)
       <br>
      - Zoho Vault (csv)
   </details>

7. 注册成功后关闭用户注册：

   在配置文件中把`SIGNUPS_ALLOWED`设置为`false`。

   然后删除并重建容器，因为映射了数据库所以数据不会被删除：

   ```bash
   docker-compose down && docker-compose up -d
   ```

8. 到此为止服务端就搭建完成了，在设备上下载软件后在设置中填入你的服务器地址，用刚才注册的账号密码注册就可以开始使用了。

### 总结

  密码的保护现在尤为重要，大家一定要保护好自己的账号密码。对于没有能力搭建的同学可以找一个会搭建的然后大家一起用，或者直接使用`1password`。至于其他免费的软件，只需要记住一句话**免费的永远都是最贵的！**。