---
title: 利用vps+nodejs爬虫实现国外软件的自动下载并且同步到百度网盘
categories: vps
date: 2018/7/11 07:21:22
tags:
- vps
- 百度网盘
---

​	买了一个国外的`vps`作为`ss`的服务器使用,但是一个月有1000g的流量根本用不完.后来想到在国内有一些网站的内容下载超级慢体验贼屎(比如`git`),所以利用`node`写了一个小爬虫,下载指定网站的`exe|zip|rar`软件,并且自动同步到百度网盘,美滋滋.

[我的百度网盘分享](https://pan.baidu.com/s/1pMZr5of)

<!--more-->

密码:8g3a

| 软件列表       |
| :--------- |
| git        |
| everything |

[github地址](https://github.com/asdjgfr/baiduwangpan_upload)

#### `vps`系统为`centos 6 x 64`

#### `node` 版本`9.x`

### 教程开始

使用了`cheerio` 作为`nodejs`爬虫的框架,这是一个类似于`jquery`操作的框架,在这只是简单的使用.

每一步都写了注释,看不懂的话就直接用就可以了.

```language-javascript
//引入内置request模块
const request = require('request');
//引入内置fs模块
const fs = require('fs');
//引入内置path模块
const path = require('path');
//引入cheerio模块,需要安装npm i cheerio -S
const cheerio = require('cheerio');
//需要下载的网站地址数组
let downloadWeblist=[
    'http://www.voidtools.com/',
    'https://git-scm.com/download/win'
];
//匹配后缀为exe,zip和rar的文件
let reg=/(\.exe|\.zip|\.rar)$/i;
//匹配最后一个/后面的内容作为名字
let reg2 = /([^/]+)$/;
// 判断有没有http/https
let reg3=/^(http)/;
//遍历所有需要下载的网站
for(let i=0;i<downloadWeblist.length;i++){
    //起个名字
    let nowDownload=downloadWeblist[i];
    //利用renquest模块去访问要下载的网站
    request(nowDownload,(...data) =>{
        //访问成功
        if (!data[0] && data[1].statusCode == 200) {
            //网页加载完成后定义$,详情查看cheerio的api
            $ = cheerio.load(data[2]);
            //找到网页中所有的a标签
            let result=$('a');
            //遍历a标签
            for(let i=0;i<result.length;i++){
                //如果包含exe,zip或rar的后缀
                if(reg.test(result[i].attribs.href)){
                    //设置名字
                    let name=result[i].attribs.href.match(reg2)[0];
                    //链接起个名字
                    let link=result[i].attribs.href;
                    //判断有没有http/https,如果有直接下载,没有加上下载网站的域名
                    if(reg3.test(link)){
                        try{
                            //下载到当前目录的download文件夹中,注意,没有这个文件夹会报错
                            request(link).pipe(fs.createWriteStream(path.join('./download',name)));
                        }catch(e){
                            //错误信息
                            console.log(`"${link}的${name}"下载失败.(╥╯^╰╥).错误信息:${e}`);
                        };
                    }else{
                        try {
                            //下载到当前目录的download文件夹中,注意,没有这个文件夹会报错
                            request(`${nowDownload}${link}`).pipe(fs.createWriteStream(path.join('./download',name)));
                        } catch (e) {
                            //错误信息
                            console.log(`"${nowDownload}${link}的${name}"下载失败.(╥╯^╰╥).错误信息:${e}`);
                        };//这
                    };//就是
                };//传说中的
            };//回调
        };//地狱
    });//吗
};//?
```

可以先在本地试一下可不可以.

新建在同级目录下新建`download`文件夹,执行文件

```language-shell
node app
```

如果`download`文件夹下出现文件的名字了表示下载成功,可以按`ctrl+c` 取消,如果没出现查看错误信息.

然后在服务器中安装`nodejs`,因为我是`centos`系统,所以使用`yum`安装

- 获取`nodejs` 资源

  ```language-shell
  curl --silent --location https://rpm.nodesource.com/setup_8.x | bash -
  ```

- 安装

  ```language-shell
  yum install -y nodejs
  ```

- 测试是否安装成功

  ```language-shell
  node -v 
  ```

  出现版本号则安装成功

- 如果`node`版本比较低,可以使用`n` 模块升级

- 全局安装`n`

  ```language-shell
  npm install n -g
  ```

- 升级到最新版

  ```language-shell
  n latest
  ```

- 升级完成后断开`vps` 重新连接**(不是重启)**,查看是否升级成功

  ```language-shell
  node -v
  ```

`nodejs` 安装完成以后把文件上传到服务器,个人感觉`FlashFXP` 挺好用,带`ui` 界面

然后在服务器执行`node app` 看看是否能下载到`vps` 里**(别忘了在同级目录新建download文件夹)**



----------------------------------我是分割线-----------------------



现在已经可以成功的把文件下载到`vps` 里面了,接下来就需要上传到百度云了,在这用的是`bpcs_uploader` 插件,[作者网站](http://oott123.com/),[作者博客](https://best33.com/)

### bpcs_uploader安装和使用

1. 首先安装`php`

   ```language-shell
   yum install php
   ```

2. 把项目clone到`vps`上

   ```language-shell
   git clone https://github.com/oott123/bpcs_uploader.git
   ```

3. 为脚本添加权限

   ```language-shell
   cd bpcs_uploader
   chmod +x bpcs_uploader.php 
   ```

4. 初始化脚本

   ```language-shell
   ./bpcs_uploader.php quickinit 
   ```



这个时候终端会询问你是否初始化，输入Y，然后会打印出许多文字，其中包括授权码。

在浏览器中访问[百度授权申请](https://openapi.baidu.com/device)。输入授权码，确定，成功后返回终端按回车键，看到屏幕上打印出了你百度网盘的容量，证明初始化完成。

完成以后就可以尝试同步一下,看看是否可以把`vps`的文件同步到百度网盘.

```language-shell
//上传：
./bpcs_uploader.php upload [path_local] [path_remote]
//举例：./bpcs_uploader.php upload /root/test.txt /test/test.txt  则本地root目录下的test.txt文件会上传到百度云/我的应用数据/bpcs_uploader/test目录下

//下载：
./bpcs_uploader.php download [path_local] [path_remote]

//删除文件：
./bpcs_uploader.php delete [path_remote]

//离线下载：
./bpcs_uploader.php fetch [path_remote] [path_to_fetch]
```

**可以同步以后**就需要实现自动化了,使用命令只能手动同步,并且必须输入文件名,那么可以写一个`shell`脚本来完成同步.

```language-shell
#!/bin/bash
# 执行node爬虫把文件下载到服务器
`node app`
# 上传到百度云盘的根目录
baidupan_DIR="/myVPS"
function searchFile(){
  for file in `ls $1`
  do
    if [ -d $1"/"$file ]
    then
      ergodic $1"/"$file
    else
      local path=$1"/"$file 
      #local name=$file      
      #local size=`du --max-depth=1 $path|awk '{print $1}'` 
      #echo $name $path $size
      #可以得到文件的名称，路径和大小，路径包含名称
      /root/bpcs_uploader/bpcs_uploader.php upload $path $baidupan_DIR/$path
    fi
  done
}
#这个必须要，否则会在文件名中有空格时出错
IFS=$'\n' 
#这里是你要批量上传文件的路径
searchFile "/usr/syncdir/download"
exit 0
```

可以把以上代码复制以后存为`.sh` 文件进行执行,但是需要注意,如果在`windows`下编辑并保存以后再`vps`上执行会报错,使用`vi` 打开会发现行尾有`^M` 字符,所以需要去掉.

```language-shell
vi -b upload.sh
```

打开文件后执行以下代码

## 注意!下面的`^`和`M`不是直接打出来的,而是`ctrl+v` 和`ctrl+m`

```language-shell
:%s/^M//g
```

替换完成后使用`:wq`保存保存并退出.

再次执行`sh`文件

```language-shell
./upload.sh
```

查看是否可以在百度云同步成功.

爬虫有了,文件批量同步百度网盘有了,就差最后一步自动化了,可以使用`crontab` 进行定时任务.

执行:

```language-shell
service crond status
//查看crond是否为开启状态
```

其他操作:

```language-shell
service crond start    //启动服务
service crond stop     //关闭服务
service crond restart  //重启服务
service crond reload   //重新载入配置
service crond status   //查看服务状态 
```

执行

```language-shell
crontab -e
```

使用`vi`输入:

```language-shell
0 2 * * 1 /你的路径/upload.sh
```

以上的意思为每周一的凌晨2点执行`upload.sh` 脚本一次

然后按下`esc`,输入`:wq`保存并退出

为了保险起见可以重启一下进程:

```language-shell
service crond restart  //重启服务
```

# DONE

当然如果没用明白没关系,你可以留言给我需要下载的外网资源,我来添加到爬虫里,然后可以使用[我的百度网盘分享](https://pan.baidu.com/s/1pMZr5of)进行下载.

密码:8g3a.