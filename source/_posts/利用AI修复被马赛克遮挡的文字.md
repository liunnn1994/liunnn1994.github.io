---
title: 利用AI修复被马赛克遮挡的文字
categories: AI
date: 2020/12/20 18:50:10
tags:
- AI
- 马赛克修复
---
​        好久没有水文章了，最近在摸鱼的时候在`GitHub`上发现了一个名为 [`Depix`](https://github.com/beurtschipper/Depix)的项目，截止目前已经`8.4k`的Star了。简介中说道：

<details open>
    <summary>Depix is a tool for recovering passwords from pixelized screenshots.</summary>
    <p>Depix是一个从像素化的截图中恢复密码的工具。</p>
</details>
​        说白了就是利用深度学习恢复被打马赛克的文字。

先看效果：

![demo](https://image.2077tech.com/uploads/big/39d546ea350daab3f5ef3370dfc7b8af.png)

<!--more-->

​        可以看到虽然没有完全恢复，但是基本也可以看出原图的文字了。由于线性盒式滤波是确定性算法，因此将相同的值进行像素化将始终导致相同的像素化块。 使用块的相同位置对相同文本进行像素化将产生相同的块值。 我们可以尝试对文本进行像素化以找到匹配的模式。 采用的解决方案就是：生成德布鲁因序列，将生成的序列粘贴到同一编辑器中，并进行截图。 该截图用作类似块的查找图像。

# 使用

### 一、运行Example

1. 克隆项目到本地并进入目录：

   ```shell
   git clone https://github.com/beurtschipper/Depix.git && cd Depix
   ```

2. 运行`Demo`看看是否能正确输出：

   ```shell
   python depix.py -p images/testimages/testimage3_pixels.png -s images/searchimages/debruinseq_notepad_Windows10_closeAndSpaced.png -o output.png
   ```

等待一会如果成功生成`output.png`并且和上面的截图差不多的话那就是成功了。

## 二、使用自己的图片尝试一下

1. 准备一张马赛克图片。

2. 准备自己的德布鲁因序列，用你的文字生成序列后使用第一步同样的工具进行截图。

   1. 在这提供一个`js`版的德布鲁因序列算法：

      ```javascript
      function debruijn(alphabet, wordlength) {
        const k= alphabet.length;
        const n= wordlength;
        if(k <= 0 || n <= 0) return '';
        const a= []; for(let i= 0 ; i < k*n ; ++i) a[i]= 0;
        let res= [];
        const db= function(t, p) {
          if(t > n) {
            if(n%p == 0) {
              for(var i= 1 ; i <= p ; ++i)
                res += alphabet[a[i]] + ' ';
            }
          }
          else {
            a[t]= a[t-p];
            db(t+1, p);
            for(var j= a[t-p]+1 ; j < k ; ++j) {
              a[t]= j;
              db(t+1, t);
            }
          }
        }
        db(1,1);
        
        let extra= '';
        for(var i= 0, nremain= wordlength-1 ; nremain>0 ; i += 2, --nremain)
          extra += res[i % res.length] + ' ';
        res += extra;
        
        return res;
      }
      ```

   2. 或者可以使用[在线版](https://damip.net/article-de-bruijn-sequence)的来生成。

3. 然后运行程序：

   ```shell
   python depix.py -p 马赛克图片路径 -s 德布鲁因序列图片路径 -o 输出.png
   ```

运行后就可以看到效果了。

> 在这提供[`Colab`的地址](https://colab.research.google.com/drive/1O8EQlUsJRZOj4_i5T7FRlJiqXhkeQ6nV?usp=sharing)，可以在线运行查看效果。

## 无效果

​        如果看不到效果也很正常，因为此算法只适合线性过滤器的马赛克。懂的人都知道**马赛克技术**是一种利用与[镶嵌画](https://zh.wikipedia.org/wiki/鑲嵌畫)装饰艺术（Mosaic）类似原理的[影像处理](https://zh.wikipedia.org/wiki/影像處理)方法。此方法将影像特定区域的色阶细节劣化并造成色块打乱的效果。其实是破坏了原图像。由于马赛克算法的不同恢复的时候也没有办法做到统一处理。所以你的图片如果是在`ps`中加的马赛克滤镜那么是恢复不了的。