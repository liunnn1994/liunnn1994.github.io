---
title: 利用AI把2D图片转换为3D - 附带colab地址
categories: AI
date: 2020/08/13 20:16:07
tags:
  - 图片转3D
  - AI
  - 人工智能
---

弗吉尼亚理工大学开源了一个图片转换为 3D 视频的[项目](https://github.com/vt-vl-lab/3d-photo-inpainting)，算法会根据模型训练出被遮挡的元素，同时提供了 4 种效果的输出。先看官方的输出示例：

<!--more-->

{%raw%}

<video src="https://image.2077tech.com/uploads/big/0cbe5085917a032ff3eec398f656d9de.mp4" controls="controls">放不了视频？你的浏览器太辣鸡了吧，赶紧换现代的浏览器。</video>

{%endraw%}

算法会根据你提供的图片来生成 3D 视频。

# 环境要求

- `Linux` (测试环境为 Ubuntu 18.04.4 LTS)
- `Anaconda`
- `Python 3.7` (测试版本为 3.7.4)
- `PyTorch 1.4.0` (测试版本为 1.4.0 for execution)
- 以及`Python`的[依赖](https://github.com/vt-vl-lab/3d-photo-inpainting/blob/master/requirements.txt)

首先初始化项目：

```shell
conda create -n 3DP python=3.7 anaconda
conda activate 3DP
pip install -r requirements.txt
conda install pytorch==1.4.0 torchvision==0.5.0 cudatoolkit==10.1.243 -c pytorch
```

然后使用提供的脚本来下载模型：

```shell
chmod +x download.sh
./download.sh
```

# 运行

> 详细参数可以查看[文档](https://github.com/vt-vl-lab/3d-photo-inpainting/blob/master/DOCUMENTATION.md)

1. 把需要训练的`jpg`格式图片放到`image`文件夹中

2. 然后运行:

   _根据配置的不同所需要的时间也不同，配置较低的话请耐心等待。_

   ```shell
   python main.py --config argument.yml
   ```

3. 最后生成的结果会输出为`video/图片名_效果.mp4`

**_如果想要修改默认配置可以查看[文档](https://github.com/vt-vl-lab/3d-photo-inpainting/blob/master/DOCUMENTATION.md)并修改`argument.yml`配置文件。_**

- 我的测试图片：

![测试图片](https://image.2077tech.com/uploads/big/1db66649060cd9471b9ef7a151bb0e87.jpg)

- 输出的结果：

{%raw%}

<video src="https://image.2077tech.com/uploads/big/9e6e25cf434ddb0fc0eaaac5135ac9ba.mp4" controls="controls">放不了视频？你的浏览器太辣鸡了吧，赶紧换现代的浏览器。</video>

{%endraw%}

# Colaboratory

如果不想在自己的机器上搭建，或没有趁（我）手（是）的（个）兵（穷）器（B）就可以使用谷歌的`Colab`来运行。`Colab`是什么在这就不多说了，直接上地址：

[图片转 3D.ipynb](https://colab.research.google.com/drive/111gGcNeuk9xmcBom3WIODGzB6wqsX51d?usp=sharing)

[GitHub 备份](https://github.com/liunnn1994/my-colab)

**我在在笔记里都写了注释，全部傻瓜式下一步就行了。**

# LICENSE

[MIT 许可](https://github.com/vt-vl-lab/3d-photo-inpainting/blob/master/LICENSE)

源项目论文：

```
@inproceedings{Shih3DP20,
  author = {Shih, Meng-Li and Su, Shih-Yang and Kopf, Johannes and Huang, Jia-Bin},
  title = {3D Photography using Context-aware Layered Depth Inpainting},
  booktitle = {IEEE Conference on Computer Vision and Pattern Recognition (CVPR)},
  year = {2020}
}
```
