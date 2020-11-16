---
title: 利用AI给你的小视频补帧到120 FPS（内有开车视频）
categories: AI
date: 2020/4/2 21:28:45
tags:
  - AI
  - DAIN
  - 补帧
  - FFmpeg
---

​ 现在各种期间手机都开始用上 120 帧的显示屏，但是网上大部分的视频还都是 30 帧，只能人工眨眼补帧*（←_←）*。视频的帧率已经远远赶不上人民群众的需求了，所以有不少人都在研究如何把普通视频变成高帧率视频。

​ 虽然`SVP`+`potplayer`可以实现实时补帧，但是文件无法保存，软件收费，只可以在`windows`上使用都是这个方案的弊端。所以在这找了两个可以实现补帧的开源项目：

<!--more-->

1. [Super SloMo](https://github.com/avinashpaliwal/Super-SloMo)
2. [DAIN](https://github.com/baowenbo/DAIN)

## Super SloMo

​ 首先第一种就是英伟达公布的一种算法**Super SloMo**，不过遗憾的是**论文发布时并没有将代码和数据集公开**，所以只能在视频中感受一下它的强大。

![Super SloMo](https://image.2077tech.com/uploads/big/0f741019debd7c95998de1e563c40c5d.gif)

​ 虽然官方没公布算法，但是一位在[德州上学的大佬](http://people.tamu.edu/~avinashpaliwal/)在`GitHub`上开源了他对 `Super-SloMo` 的 `PyTorch` 实现。

​ 不过这个算法用的人比较少，可能是因为没有`windows`打包版的提高了门槛？有时间再试一下吧，在这就不赘述了。

## DAIN

​ 第二种就是来自上海交大的一个新的插帧算法**DAIN**。**DAIN**的代码已经开源，甚至开发人员还打包了一份[**Windows 安装程序**](https://grisk.itch.io/dain-app)，即使没有任何 AI 基础的用户也可以直接拿来用。不过在这别高兴太早，虽然有`windows`的打包版本，但是在我的电脑上，默认参数根本跑不了，降低网格后速度超级慢，**1 个小时**的视频大概需要**1 周多**才能完成，油管上的`UP主`测试几分钟的视频`RTX 2080TI`要跑好几个小时。所以要想使用`windows`版的`RTX 2080TI`勉勉强强，`TESLA V100`应该是比较好的选择。不过看着**6w 块**的`TESLA V100` 再看看钱包里的空气，只能一声叹息。不过好在还有谷歌这种无（财）私（大）奉（气）献（粗）的公司。在我之前的博客里 [利用 AI 把老照片修复成彩色 4K 并实现微信小程序查看管理](https://blog.2077tech.com/2020/02/07/人工智能修复照片/) 提到过谷歌的`google colab`。这次还是使用它来实现。

​ 首先还是先来段飙车视频，上面的是原版 30 帧的，下面是修复后 60 帧的：

{%raw%}

<video src="https://image.2077tech.com/uploads/big/b09680d0b62559b548be3748196d013b.mp4" controls="controls" poster="https://image.2077tech.com/uploads/big/82e7dc1396a94a720d7eb5de074ac5bf.jpg">放不了视频？你的浏览器太辣鸡了吧，赶紧换现代的浏览器。</video>

{%endraw%}

> 如果你看不出来区别那要么你需要换个显示器，或者做个眼保健操。

### dain for colab 的使用

1. 首先定义一下需要的配置

```python
################# 配置 ############################

# INPUT_FILEPATH：输入文件的路径（相对于Google云盘的根目录）。
# 例如，如果您将"example.mkv"文件保存在Google云盘中的"videos"文件夹中，则路径为：
# videos/example.mkv
INPUT_FILEPATH = "DAIN/input.mkv"

# OUTPUT_FILE_PATH: 输出文件的路径（相对于Google云盘的根目录）。
# 目标文件类型建议使用 mp4
OUTPUT_FILE_PATH = "DAIN/output.mp4"

################# DAIN 配置 ############################

# TARGET_FPS：目标FPS
TARGET_FPS = 60

# 输入帧
# 如果在Google云盘上有现成帧（00001.png, 00002.png）则改为云盘路径
# Google云盘地址 `/content/gdrive/My Drive/`
FRAME_INPUT_DIR = '/content/DAIN/input_frames'

# 输出帧
# 如果要将生成的帧存储到Google云盘，请使用GDrive中的位置。
# Google云盘地址 `/content/gdrive/My Drive/`
FRAME_OUTPUT_DIR = '/content/DAIN/output_frames'

# 无缝循环
# 通过将第一个帧也用作最后一个帧来创建无缝循环。
SEAMLESS = False

# 调整大小
# 与原始输入帧相比，DAIN 帧有些“偏移/较小”。 调整大小可以部分缓解这种情况
# 将帧设置为+2px的分辨率，并以起点（1,1）将结果裁剪为原始分辨率。
# 如果没有此修复程序，DAIN往往会产生震动模糊，并且在诸如文本之类的静态元素中非常明显。
# 用户可以更改插值方法。 建议使用方法cv2.INTER_CUBIC和cv2.INTER_LANCZOS4。
# 当前默认值为 cv2.INTER_LANCZOS4.
RESIZE_HOTFIX = True

# ffmpeg生成视频后自动删除输出的PNG文件夹
AUTO_REMOVE = True
```

2. 然后挂载谷歌云盘，需要训练的视频和成果都放在网盘里方便储存。至于为什么非要挂载谷歌云盘就去[上一次的文章](https://blog.2077tech.com/2020/02/07/人工智能修复照片/)看吧

> 填入授权码以后记得回车确定

```python
from google.colab import drive
drive.mount('/content/gdrive')
print('谷歌云盘挂载成功！')
```

3. 检查一下`GPU`，不合适的话重新分配一个。

> P100: 16GB （正常）
>
> T4: 16GB （CUDA 会失败）
>
> P4: 8GB （正常）
>
> K80: 8GB （未随机到这个 GPU）

```bash
!nvidia-smi --query-gpu=gpu_name,driver_version,memory.total --format=csv
```

4. 安装依赖，这一步会消耗很长时间，耐心等待就可以了

```python
from IPython.display import clear_output
!git clone https://github.com/asdjgfr/Colab-DAIN.git /content/DAIN

# 这步可能需要15分钟
# 构建 DAIN.
%cd /content/DAIN/my_package/
!./build.sh
print("构建第一步成功！")

# 大概需要5分钟
# Building DAIN PyTorch correlation package.
%cd /content/DAIN/PWCNet/correlation_package_pytorch1_0
!./build.sh
print("构建第二步成功！")

# 下载 pre-trained 模型
%cd /content/DAIN
!mkdir model_weights
!wget -O model_weights/best.pth http://vllab1.ucmerced.edu/~wenbobao/DAIN/best.pth
# 如果上面失效可以使用备用地址：
# !wget -O model_weights/best.pth https://www.2077tech.com/files/dain/best.pth

!CUDA_VISIBLE_DEVICES=0

!sudo apt-get install imagemagick imagemagick-doc
```

5. 检查一下原视频

```python
%shell yes | cp -f /content/gdrive/My\ Drive/{INPUT_FILEPATH} /content/DAIN/

import os
filename = os.path.basename(INPUT_FILEPATH)

import cv2
cap = cv2.VideoCapture(f'/content/DAIN/{filename}')

fps = cap.get(cv2.CAP_PROP_FPS)

if(fps/TARGET_FPS>0.5):
  print("请定义一个更高的FPS，因为没有足够的时间用于新帧。旧FPS/新FPS应低于0.5，如果尝试补帧有可能会失败。")
```

6. 提取原视频的帧，并删除带有透明通道的帧

```python
# ffmpeg 提取 - 从源文件生成单个帧的PNG文件。
%shell rm -rf '{FRAME_INPUT_DIR}'
%shell mkdir -p '{FRAME_INPUT_DIR}'

%shell ffmpeg -i '/content/DAIN/{filename}' '{FRAME_INPUT_DIR}/%05d.png'

png_generated_count_command_result = %shell ls '{FRAME_INPUT_DIR}' | wc -l
clear_output()

pngs_generated_count = int(png_generated_count_command_result.output.strip())

import shutil
if SEAMLESS==True:
  pngs_generated_count += 1
  original = str(FRAME_INPUT_DIR)+"/00001.png"
  target = str(FRAME_INPUT_DIR)+"/"+str(pngs_generated_count).zfill(5)+".png"
  shutil.copyfile(original, target)

print(f"输入 FPS: {fps}")
print(f"{pngs_generated_count} 帧 PNG 生成！")

# 检查图片是否拥有透明通道
import subprocess as sp
%cd {FRAME_INPUT_DIR}
channels = sp.getoutput('identify -format %[channels] 00001.png')
print (f"{channels} 命中")

# 如果拥有透明通道则删除
if "a" in channels:
  print("检测到透明通道，即将删除！")
  print(sp.getoutput('find . -name "*.png" -exec convert "{}" -alpha off PNG24:"{}" \;'))
```

7. 等上面的都完成后就可以开始训练了

> 这一步会根据你要补得帧数，视频的分辨率，机器的配置等因素不同消耗不一样的时间，基本上几分钟的视频（30 FPS 转 60 FPS）都会需要几个小时

```python
%shell mkdir -p '{FRAME_OUTPUT_DIR}'
%cd /content/DAIN

!python colab_interpolate.py --netName DAIN_slowmotion --time_step {fps/TARGET_FPS} --start_frame 1 --end_frame {pngs_generated_count} --frame_input_dir '{FRAME_INPUT_DIR}' --frame_output_dir '{FRAME_OUTPUT_DIR}'
```

8. 等都完成后进行优化

> 放大和裁剪以匹配原始图像

```python
import numpy as np
%cd {FRAME_OUTPUT_DIR}
if(RESIZE_HOTFIX==True):
  images = []
  for filename in os.listdir(f'{FRAME_OUTPUT_DIR}'):
    img = cv2.imread(os.path.join(f'{FRAME_OUTPUT_DIR}',filename))
    part_filename = os.path.splitext(filename)
    if(part_filename[0].endswith('0')==False):
      dimension = (img.shape[1]+2, img.shape[0]+2)
      resized = cv2.resize(img, dimension, interpolation=cv2.INTER_LANCZOS4)
      crop = resized[1:(dimension[1]-1), 1:(dimension[0]-1)]
      cv2.imwrite(part_filename[0]+".png", crop)

%cd /content/DAIN
```

9. 最后合成视频

```python
%cd {FRAME_OUTPUT_DIR}
%shell ffmpeg -y -r {TARGET_FPS} -f image2 -pattern_type glob -i '*.png' '/content/gdrive/My Drive/{OUTPUT_FILE_PATH}'
if(AUTO_REMOVE==True):
  !rm -rf {FRAME_OUTPUT_DIR}/*
```

10. 如果原视频是有声音的，那么记得提取声音

```python
%cd {FRAME_OUTPUT_DIR}
%shell ffmpeg -i '/content/DAIN/{filename}' -acodec copy output-audio.aac
%shell ffmpeg -y -r {TARGET_FPS} -f image2 -pattern_type glob -i '*.png' -i output-audio.aac -shortest '/content/gdrive/My Drive/{OUTPUT_FILE_PATH}'
if(AUTO_REMOVE==True):
  !rm -rf {FRAME_OUTPUT_DIR}/*
  !rm -rf output-audio.aac
```

​ 现在你的视频就训练完成了，可以到你最开始定义的文件夹去下载，如果是按照我的教程来的话那就是在谷歌云盘的根目录下的`DAIN`文件夹里。

​ 如果想要训练下一个视频的话记得清空之前输出的帧图片：

```bash
!rm -rf {FRAME_OUTPUT_DIR}/*
```

之后从步骤 5 再次运行就可以了，依赖在空间收回之前只需要安装一次。

### 最后分享一下[我的 Colab 笔记](https://colab.research.google.com/drive/1-xzp-zDQqUJ44el2iTKZy1nE-H-UG45c)，只需要一直下一步就可以了。
