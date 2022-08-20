---
sidebar: auto
---

# SpringCloud Alibaba

## SpringCloud Alibaba Nacos服务注册和配置中心

### 注册中心使用

运行nacos客户端

改POM

~~~xml
<dependency>
	<groupId>com.alibaba.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
~~~

改yml

~~~yml
  cloud:
    nacos:
      discovery:
        server-addr: http://127.0.0.1:8848 #配置Nacos地址
~~~

主启动加入@EnableDiscoveryClient注解

### 配置中心使用

改POM

~~~xml
<dependency>
	<groupId>com.alibaba.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
~~~

改yml，Nacos同springcloud-config一样，在项目初始化时，要保证先从配置中心进行配置拉取，拉取配置之后，才能保证项目的正常启动。springboot中配置文件的加载是存在优先级顺序的，bootstrap优先级高于application。bootstrap.yml

~~~yml
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848 #服务注册中心地址
      config:
        server-addr: 127.0.0.1:8848 #配置中心地址
        file-extension: yaml #指定yaml格式的配置（yml和yaml都可以）
        # 命名空间
        namespace: 508abb0a-1cac-49d6-83f1-f6e3f7b804c5
        # 分组
        group: dev_group2
#${spring.application.name}-${spring.profiles.active}.${spring.cloud.nacos.config.file-extension}
#nacos-config-client-dev.yaml  (一定要与file-extension值保持一致)
~~~

application.yml

~~~yml
spring:
	profiles:
		active: dev
~~~

主启动加入@EnableDiscoveryClient注解,调用类加入@RefreshScopee实现配置自动更新

> 云上的配置文件名称要和这个一致
>
> ${spring.application.name}-${spring.profiles.active}.${spring.cloud.nacos.config.file-extension}

### 分类配置

Namespace+Group+Data ID三者完成分类配置

默认情况：Namespace=public，Group=DEFAULT_GROUP，默认Cluster是DEFAULT，Data ID就是配置文件的名称

1. Nacos默认的命名空间是public，Namespace主要用来实现隔离。比方说我们现在有三个环境：**开发、测试、生产环境**，我们就可以创建三个Namespace，不同的 Namespace之间是隔离的。
2. Group默认是**DEFAULT_GROUP**，Group可以把不同的微服务划分到同一个分组里面去。Service就是微服务，一个Service可以包含多个Cluster(集群)，Nacos默认Cluster是**DEFAULT**，Cluster是对指定微服务的一个虚拟划分。比方说为了容灾，将Service微服务分别部署在了**杭州机房**和**广州机房**，这时就可以给杭州机房的Service微服务起一个集群名称(**HZ**)，给广州机房的Service微服务起一个集群名字(**GZ**)，还可以尽量让同一个机房的微服务互相调用，以提升性能。

最后是Instance，就是微服务的实例。

### 共享配置(shared-configs)和扩展配(extension-config)

日常开发中，多个模块可能会有很多共用的配置，比如数据库连接信息，Redis 连接信息，RabbitMQ 连接信息，监控配置等等。那么此时，我们就希望可以加载多个配置，多个项目共享同一个配置之类等功能，Nacos Config 也确实支持。

- Nacos在配置路径`spring.cloud.nacos.config.extension-config`下，允许我们指定⼀个或多个额外配置。
- Nacos在配置路径`spring.cloud.nacos.config.shared-configs`下，允许我们指定⼀个或多个共享配置。

上述两类配置都⽀持三个属性：`data-id`、`group`(默认为字符串`DEFAULT_GROUP`)、`refresh`(默认为`true`)。

```yml
  cloud:
    nacos:
      username: ${nacos.username}
      password: ${nacos.password}
      config:
        server-addr: ${nacos.server-addr}
        namespace: ${nacos.namespace}
        # 用于共享的配置文件
        shared-configs:
          - data-id: common-mysql.yaml
            group: SPRING_CLOUD_EXAMPLE_GROUP
          - data-id: common-redis.yaml
            group: SPRING_CLOUD_EXAMPLE_GROUP
        # 常规配置文件
        # 优先级大于 shared-configs，在 shared-configs 之后加载
        extension-configs:
          - data-id: nacos-config-advanced.yaml
            group: SPRING_CLOUD_EXAMPLE_GROUP
            refresh: true
          - data-id: nacos-config-base.yaml
            group: SPRING_CLOUD_EXAMPLE_GROUP
            refresh: true
```

参数解析：

- data-id : Data Id
- group：自定义 Data Id 所在的组，不明确配置的话，默认是 DEFAULT_GROUP。
- refresh: 控制该 Data Id 在配置变更时，是否支持应用中可动态刷新， 感知到最新的配置值。默认是不支持的。

注意：这里的`Data ID`后面是加`.yaml`后缀的，且不需要指定`file-extension`。

**共享配置和扩展配置的区别**

实际上，Nacos中并未对`extension-configs`和`shared-configs`的差别进⾏详细阐述。我们从他们的结构，看不出本质差别；除了优先级不同以外，也没有其他差别。

**Nacos对配置的默认理念**

- `namespace`区分环境：开发环境、测试环境、预发布环境、⽣产环境。
- `group`区分不同应⽤：同⼀个环境内，不同应⽤的配置，通过`group`来区分。

**主配置是应⽤专有的配置**

因此，主配置应当在`dataId`上要区分，同时最好还要有`group`的区分，因为`group`区分应⽤（虽然`dataId`上区分了，不⽤设置`group`也能按应⽤单独加载）。

**要在各应⽤之间共享⼀个配置，请使⽤上⾯的 shared-configs**

因此按该理念，`shared-configs`指定的配置，本来应该是不指定`group`的，也就是应当归⼊`DEFAULT_GROUP`这个公共分组。

**如果要在特定范围内（⽐如某个应⽤上）覆盖某个共享dataId上的特定属性，请使⽤ extension-config**

⽐如，其他应⽤的数据库url，都是⼀个固定的url，使⽤`shared-configs.dataId = mysql`的共享配置。但其中有⼀个应⽤`ddd-demo`是特例，需要为该应⽤配置扩展属性来覆盖。

```yml
 cloud:
   nacos:
     config:
       server-addr: localhost:8848
       namespace: test2
       group: ddd-demo
       shared-configs[3]:
         data-id: mysql.yaml
         refresh: true
       extension-configs[3]:
         data-id: mysql.yaml
         group: ddd-demo
         refresh: true
```

**关于优先级**

1、上述两类配置都是数组，对同种配置，数组元素对应的下标越⼤，优先级越⾼。也就是排在后⾯的相同配置，将覆盖排在前⾯的同名配置。

- 同为扩展配置，存在如下优先级关系：`extension-configs[3] > extension-configs[2] > extension-configs[1] > extension-configs[0`。
- 同为共享配置，存在如下优先级关系：`shared-configs[3] > shared-configs[2] > shared-configs[1] > shared-configs[0]`。

2、不同种类配置之间，优先级按顺序如下：主配置 > 扩展配置(extension-configs) > 共享配置(shared-configs)

## SpringCloud Alibaba Sentinel服务降级熔断与限流

怎么用：
下载客户端jar包运行。

改pom

~~~xml
<dependency>
	<groupId>com.alibaba.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
~~~

改yml

~~~yml
sentinel:
	transport:
		dashboard: localhost:8080
		port: 8719  #默认8719，应用与Sentinel控制台交互的端口，应用本地会起一个该端口占用HttpServer
~~~

### 流控规则

- 资源名：唯一名称，默认请求路径=
- 针对来源：Sentinel可以针对调用者进行限流，填写微服务名，默认default(不区分来源)
- 阈值类型/单机阈值：
  - QPS（每秒钟的请求数量）：当代用该api的QPS达到阈值的时候，进行限流
  - 线程数：当调用改api的线程数达到阈值的时候，进行限流
- 是否集群
- 流控模式：
  - 直接：api达到限流条件时，直接限流
  - 关联：当关联的资源达到阈值时，就限流自己
  - 链路：只记录指定链路上的流量（制定资源从入口资源进来的流量，如果达到阈值，就进行限流）api级别的针对来源
- 流控效果
  - 快速失败：直接失败，抛异常
  - Warm Up:根据codeFactor（冷加载因子，默认3）的值，从阈值/codeFactor，经过预热时长，才达到设置的QPS阈值。
  - 排队等待：匀速排队，让请求以匀速的速度通过，阈值类型必须设置为QPS，否则无效

### 流控模式

- 直接（默认）

  快速失败，QPS1,阈值1，表示1秒内查询1次就是ok。若超过次数1，就直接快速失败，报默认错误，线程同理。

- 关联

  当关联的资源达到阈值时，限流自己，当与A关联的资源B达到阈值后，就限流自己

- 链路

  多个请求调用了同一个微服务

### 流控效果

- 直接->快速失败（默认的流控处理）

  直接失败，抛出异常：Blocked by Sentinel (flow limiting)

- 预热

  默认QPS从阈值除以coldFactor（默认值为3）开始，经过预热时长后才会达到阈值

- 排队等待

  让请求以均匀的速度通过，等待超时时间，阈值类型必须设置成QPS，否则无效。

  ### 降级规则

- 慢调用比例

  简单来说就是，统计时长内的请求数中，阈值百分比的请求响应时间都大于最大RT，则系统熔断指定时长。

- 异常比例

  简单来说就是，统计时长内的请求数中，比例阈值的请求出现异常，则系统熔断指定时长。半开时，如果再次访问有异常，继续熔断。

- 异常数

  简单来说就是，统计时长内的请求数中，异常数超过指定的异常数，则系统熔断指定时长。半开时，如果再次访问有异常，继续熔断。

### 热点key限流

对指定参数，指定参数索引进行限流，其他的不限流。

### 系统规则

- Load自适应：系统的load1作为启发指标，进行自适应系统保护。当系统load1超过设定的启发值，且系统当前的并发线程数超过预算的系统容量时才会触发系统保护（BBR阶段）。系统容量是由系统的maxQPS * minRt估算得出。设定参数一般是CPU cores * 2.5.
- CPU usage：当系统CPU使用率超过阈值即触发系统保护（取值范围0.0-1.0），比较灵敏
- 平均 RT：当单台机器上所有入口流量的平均RT达到阈值即出发系统保护机制，单位是毫秒。
- 并发线程数：当单台机器上所有入口流量的并发线程数达到阈值即触发系统保护。
- 入口QPS ：当单台机器上所有入口流量的QPS达到阈值即触发系统保护。

### @SentinelResource

可以使用@SentinelResource指定兜底方法。

~~~java
@GetMapping("/testHotKey")
@SentinelResource(value = "testHotKey",blockHandler = "deal_testHotKey")
public String testHotKey(@RequestParam(value = "p1",required = false) String p1,
                         @RequestParam(value = "p2",required = false) String p2) {
    //int age = 10/0;
    return "------testHotKey";
}

//兜底方法
public String deal_testHotKey (String p1, String p2, BlockException exception){
    return "------deal_testHotKey,o(╥﹏╥)o";  
}
~~~

每个类都要写兜底方法，代码耦合性高。代码解耦：

~~~java
// 自定义兜底方法
public class CustomerBlockHandler {
    
public static CommonResult handleException(BlockException exception){
        return new CommonResult(2020,"自定义限流处理信息.... CustomerBlockHandler --- 1");
    }

    public static CommonResult handleException2(BlockException exception){
        return new CommonResult(2020,"自定义限流处理信息.... CustomerBlockHandler --- 2");
    }
}
~~~

~~~java
@GetMapping("/rateLimit/customerBlockHandler")
		// 指定兜底方法
@SentinelResource(value = "customerBlockHandler",
  blockHandlerClass = CustomerBlockHandler.class, blockHandler = "handleException2")
public CommonResult customerBlockHandler(){
    return new CommonResult(200,"自定义处理",new Payment(2020L,"serial003"));
}
~~~

### 规则持久化

一旦我们重启应用，Sentinel规则将消失，生产环境需要将配置规则进行持久化,将限流配置规则持久化进Nacos保存，只要刷新地址，sentinel控制台的流控规则就能看到，只要Nacos里面的配置不删除，Sentinel上的流控规则持续有效

POM

~~~xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
</dependency>
~~~

yml

~~~yml
    sentinel:
      datasource:
        ds1:
          nacos:
            server-addr: 127.0.0.1:8848
            dataId: cloudalibaba-sentinel-service
            groupId: DEFAULT_GROUP
            data-type: json
            rule-type: flow
~~~

nacos中新建相关配置：

~~~json
[
    {
         "resource": "/testA",
         "limitApp": "default",
         "grade": 1,
         "count": 1,
         "strategy": 0,
         "controlBehavior": 0,
         "clusterMode": false 
    }
]
~~~