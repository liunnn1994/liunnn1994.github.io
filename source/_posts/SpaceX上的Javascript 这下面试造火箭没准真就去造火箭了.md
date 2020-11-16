---
title: SpaceX上的Javascript 这下面试造火箭没准真就去造火箭了
categories: javascript
date: 2020/06/05 18:32:01
tags:
- JavaScript
- SpaceX
---

  在上个月[SpaceX ](https://www.spacex.com/)成功发射了载人火箭*Dragon 2*，其中的飞行界面就是由`Chromium `和`JavaScript`进行构建的，当然只有图形界面是，系统的其他部分还是由`c++`来完成的。

> Also, only the actual graphical display application uses Chromium/JS. The rest of the system is all C++. The display code has 100% test coverage, down to validation of graphical output (for example if you have a progress bar and you set it to X% the tests verify that it is actually drawn correctly).

  不知道会不会出现**氧气剩余 NaN%**，**着陆地点`undefined`**

![undefined](https://image.2077tech.com/uploads/big/3d12fbc221b10f3303972ad5cb29093d.jpeg)

  火箭的操作界面估计是不会开源了，但是`SpaceX-API `倒是在`GitHub`上开源了。

  继[阿波罗登月的代码](https://github.com/chrislgarry/Apollo-11)之后又参与了[SpaceX-API  ](https://github.com/r-spacex/SpaceX-API)的`review`，以后面试问我参与过什么项目就可以说参与过**阿波罗登月计划**和**SpaceX 载人航天计划**的`code review`。感觉准备个`PPT`可以去融资了。

<!--more-->

### 什么是SpaceX-API 

  `SpaceX-API` 是一个用于火箭、核心舱、太空舱、发射台和发射数据的开源 REST API。

  [接口文档](https://docs.spacexdata.com)展示了所提供的 `API `接口，还包括多种语言的接口调用。

  比如`dragons`的信息：

```json
[
  {
    "id": "dragon1",
    "name": "Dragon 1",
    "type": "capsule",
    "active": true,
    "crew_capacity": 0,
    "sidewall_angle_deg": 15,
    "orbit_duration_yr": 2,
    "dry_mass_kg": 4200,
    "dry_mass_lb": 9300,
    "first_flight": "2010-12-8",
    "heat_shield": {
      "material": "PICA-X",
      "size_meters": 3.6,
      "temp_degrees": 3000,
      "dev_partner": "NASA"
    },
    "thrusters": [
      {
        "type": "Draco",
        "amount": 18,
        "pods": 4,
        "fuel_1": "nitrogen tetroxide",
        "fuel_2": "monomethylhydrazine",
        "thrust": {
          "kN": 0.4,
          "lbf": 90
        }
      }
    ],
    "launch_payload_mass": {
      "kg": 6000,
      "lb": 13228
    },
    "launch_payload_vol": {
      "cubic_meters": 25,
      "cubic_feet": 883
    },
    "return_payload_mass": {
      "kg": 3000,
      "lb": 6614
    },
    "return_payload_vol": {
      "cubic_meters": 11,
      "cubic_feet": 388
    },
    "pressurized_capsule": {
      "payload_volume": {
        "cubic_meters": 11,
        "cubic_feet": 388
      }
    },
    "trunk": {
      "trunk_volume": {
        "cubic_meters": 14,
        "cubic_feet": 494
      },
      "cargo": {
        "solar_array": 2,
        "unpressurized_cargo": true
      }
    },
    "height_w_trunk": {
      "meters": 7.2,
      "feet": 23.6
    },
    "diameter": {
      "meters": 3.7,
      "feet": 12
    },
    "wikipedia": "https://en.wikipedia.org/wiki/SpaceX_Dragon",
    "description": "Dragon is a reusable spacecraft developed by SpaceX, an American private space transportation company based in Hawthorne, California. Dragon is launched into space by the SpaceX Falcon 9 two-stage-to-orbit launch vehicle. The Dragon spacecraft was originally designed for human travel, but so far has only been used to deliver cargo to the International Space Station (ISS)."
  },
  {
    "id": "dragon2",
    "name": "Dragon 2",
    "type": "capsule",
    "active": false,
    "crew_capacity": 7,
    "sidewall_angle_deg": 15,
    "orbit_duration_yr": 2,
    "dry_mass_kg": 6350,
    "dry_mass_lb": 14000,
    "first_flight": null,
    "heat_shield": {
      "material": "PICA-X",
      "size_meters": 3.6,
      "temp_degrees": 3000,
      "dev_partner": "NASA"
    },
    "thrusters": [
      {
        "type": "Draco",
        "amount": 18,
        "pods": 4,
        "fuel_1": "nitrogen tetroxide",
        "fuel_2": "monomethylhydrazine",
        "thrust": {
          "kN": 0.4,
          "lbf": 90
        }
      },
      {
        "type": "SuperDraco",
        "amount": 8,
        "pods": 4,
        "fuel_1": "dinitrogen tetroxide",
        "fuel_2": "monomethylhydrazine",
        "thrust": {
          "kN": 71,
          "lbf": 16000
        }
      }
    ],
    "launch_payload_mass": {
      "kg": 6000,
      "lb": 13228
    },
    "launch_payload_vol": {
      "cubic_meters": 25,
      "cubic_feet": 883
    },
    "return_payload_mass": {
      "kg": 3000,
      "lb": 6614
    },
    "return_payload_vol": {
      "cubic_meters": 11,
      "cubic_feet": 388
    },
    "pressurized_capsule": {
      "payload_volume": {
        "cubic_meters": 11,
        "cubic_feet": 388
      }
    },
    "trunk": {
      "trunk_volume": {
        "cubic_meters": 14,
        "cubic_feet": 494
      },
      "cargo": {
        "solar_array": 2,
        "unpressurized_cargo": true
      }
    },
    "height_w_trunk": {
      "meters": 7.2,
      "feet": 23.6
    },
    "diameter": {
      "meters": 3.7,
      "feet": 12
    },
    "wikipedia": "https://en.wikipedia.org/wiki/Dragon_2",
    "description": "Dragon 2 (also Crew Dragon, Dragon V2, or formerly DragonRider) is the second version of the SpaceX Dragon spacecraft, which will be a human-rated vehicle. It includes a set of four side-mounted thruster pods with two SuperDraco engines each, which can serve as a launch escape system or launch abort system (LAS). In addition, it has much larger windows, new flight computers and avionics, and redesigned solar arrays, and a modified outer mold line from the initial cargo Dragon that has been flying for several years."
  }
]
```

  其中使用的技术栈：

1. 后台框架使用的是 **Koa**。

2. 内容缓存使用的是 **Redis**、**Nginx** 和 **Cloudflare** 。

3. 测试使用的是 **Jest** 和 **Supertest** 。

4. 使用 **Circle CI** 进行持续集成/部署。

5. 数据库使用的是 **MongoDB **。



### 本地部署

1. 首先`clone`项目

   ```bash
   git clone https://github.com/r-spacex/SpaceX-API.git && cd SpaceX-API
   ```

2. 安装并启动`MongoDB`数据库

3. 安装依赖

   ```bash
   npm i
   ```

   or

   ```bash
   yarn
   ```

4. 运行测试

   ```bash
   npm test
   ```

5. 启动

   ```bash
   npm start
   ```

   or

   ```bash
   yarn start
   ```

### 使用Docker部署

当然也可以使用`Docker`来进行部署：

```bash
git clone https://github.com/r-spacex/SpaceX-API.git && cd SpaceX-API
docker-compose build
docker-compose up
```



### 总结

  虽然这个项目不是真的造火箭，但好歹也能吹吹牛逼。而且代码质量和工程结构都可以学习学习。

![复制粘贴一把梭](https://image.2077tech.com/uploads/big/939bcec0b941ed014dc4303854247bf3.png)

