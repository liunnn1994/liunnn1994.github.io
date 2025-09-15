---
title: JavaScript实现Twitter雪花算法
categories: javascript
pubDatetime: 2019-11-26T10:44:23.000Z
description: JavaScript实现Twitter雪花算法
tags:
- JavaScript
- 算法
---

# 使用SnowFlake的理由

按照时间自增，可排序。

并且整个分布式系统内不会产生ID碰撞(由数据中心ID和机器ID作区分)。

经测试[ MacBook Pro (15-inch, 2018)](https://support.apple.com/kb/SP776?locale=zh_CN) 每秒可产生**136万**左右的ID。



# Twitter_Snowflake

[twitter](https://twitter.com/)开源的地址：[twitter-archive/snowflake](https://github.com/twitter-archive/snowflake/tree/updated_deps)

>SnowFlake的结构如下(共64bits，每部分用-分开):
>
> 0 - 0000000000 0000000000 0000000000 0000000000 0 - 00000 - 00000 - 000000000000
>
> |   ----------------------|----------------------   --|--   --|--   -----|------
>
> 1bit不用                41bit 时间戳                  数据标识id 机器id     序列号id
>
> - 1位标识，二进制中最高位为1的都是负数，但是我们生成的id一般都使用整数，所以这个最高位固定是0
>- 41位时间戳，41位时间截不是存储当前时间的时间截，而是存储时间截的差值（当前时间截 - 开始时间截得到的值），这里的的开始时间截，一般是我们的id生成器开始使用的时间，由我们程序来指定的（如下下面程序IdWorker类的startTime属性）。41位的时间截，可以使用69年，年T = (1L << 41) / (1000L * 60 * 60 * 24 * 365) = 69
> - 10位的数据机器位，可以部署在1024个节点，包括5位dataCenterId和5位workerId
> - 12位序列，毫秒内的计数，12位的计数顺序号支持每个节点每毫秒(同一机器，同一时间截)产生4096个ID序号
> - 加起来刚好64位，为一个Long型。


<!--more-->


# 实现

> 思路还是很简单的，直接写结果+注释吧。




```javascript
class SnowFlake {
  /**
   * @param {bigInt} workerId 工作ID (0~31)
   * @param {bigInt} dataCenterId 数据中心ID (0~31)
   */
  constructor(workerId, dataCenterId) {
    // 开始时间
    this.startTime = BigInt(new Date().getTime());
    // 位数划分 [数据标识id(5bit 31)、机器id(5bit 31)](合计共支持1024个节点)、序列id(12bit 4095)
    this.workerIdBits = 5n;
    this.dataCenterIdBits = 5n;
    this.sequenceBits = 12n;

    // 支持的最大十进制id
    // -1 左移5位后与 -1 异或
    this.maxWorkerId = -1n ^ (-1n << this.workerIdBits);
    this.maxDataCenterId = -1n ^ (-1n << this.dataCenterIdBits);
    // 生成序列的掩码，这里为4095 (0b111111111111=0xfff=4095)
    this.sequenceMask = -1n ^ (-1n << this.sequenceBits);

    // 机器ID向左移12位 数据标识id向左移17位(12+5) 时间截向左移22位(5+5+12)
    this.workerIdShift = this.sequenceBits;
    this.dataCenterIdShift = this.sequenceBits + this.workerIdBits;
    this.timestampLeftShift = this.dataCenterIdShift + this.dataCenterIdBits;

    // 工作机器ID(0~31) 数据中心ID(0~31) 毫秒内序列(0~4095)
    this.sequence = 0n;

    // 上次生成ID的时间戳，保存在内存中。
    this.lastTimestamp = -1n;

    const {
      maxWorkerId,
      maxDataCenterId
    } = this;
    if (workerId > maxWorkerId || workerId < 0n) {
      throw new Error(
        `workerId 不能大于 ${maxWorkerId} 或小于 0`
      );
    }
    if (dataCenterId > maxDataCenterId || dataCenterId < 0n) {
      throw new Error(
        `dataCenterId 不能大于 ${maxDataCenterId} 或小于 0`
      );
    }
    this.workerId = workerId;
    this.dataCenterId = dataCenterId;
    return this;
  }

  /**
   * 获得下一个ID (该方法是线程安全的)
   *
   * @returns {bigint} SnowflakeId 返回 id
   */
  nextId() {
    let timestamp = this.timeGen();
    // 如果当前时间小于上一次ID生成的时间戳，说明系统时钟回拨过这个时候应当抛出异常
    const diff = timestamp - this.lastTimestamp;
    if (diff < 0n) {
      throw new Error(
        `出现时钟回拨。拒绝生成 ${-diff} 毫秒的ID`
      );
    }

    // 如果是同一时间生成的，则进行毫秒内序列
    if (diff === 0n) {
      this.sequence = (this.sequence + 1n) & this.sequenceMask;
      // 毫秒内序列溢出
      if (this.sequence === 0n) {
        // 阻塞到下一个毫秒，获得新的时间戳
        timestamp = this.tilNextMillis(this.lastTimestamp);
      }
    } else {
      // 时间戳改变，毫秒内序列重置
      this.sequence = 0n;
    }

    // 保存上次生成ID的时间截
    this.lastTimestamp = timestamp;

    // 移位并通过或运算拼到一起组成64位的ID
    // 将各 bits 位数据移位后或运算合成一个大的64位二进制数据
    return (
      ((timestamp - this.startTime) << this.timestampLeftShift) | // 时间数据左移22
      (this.dataCenterId << this.dataCenterIdShift) | // 数据标识id左移 17
      (this.workerId << this.workerIdShift) | // 机器id左移 12
      this.sequence
    );
  }
  /**
   * 阻塞到下一个毫秒，直到获得新的时间戳
   * @param {bigInt} lastTimestamp 上次生成ID的时间截
   * @return {bigInt} 当前时间戳
   */
  tilNextMS(lastTimestamp) {
    let timestamp = this.timeGen();
    while (timestamp <= lastTimestamp) {
      timestamp = this.timeGen();
    }
    return timestamp;
  }
  /**
   * 返回以毫秒为单位的当前时间
   * @return {bigInt} 当前时间(毫秒)
   */
  timeGen() {
    return BigInt(+new Date());
  }
}
```


# 测试一下

```javascript
(function () {
  console.time('id');
  const idWorker = new SnowFlake(1n, 1n);
  const tempArr = [];
  for (let i = 0; i < 100000; i++) {
    tempArr.tempArr(idWorker.nextId());
  }
  console.timeEnd('id');
})()
```
