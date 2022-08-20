---
sidebar: auto
---


# SpringCloud

## Springcloud和Springboot之间的依赖关系

[依赖关系](https://start.spring.io/actuator/info)

## RestTemplate

RestTemplate提供了多种便捷访问远程Http服务的方法， 是一种简单便捷的访问restful服务模板类，是Spring提供的用于访问Rest服务的客户端模板工具集

### 使用

- 官网地址 https://docs.spring.io/spring-framework/docs/5.2.2.RELEASE/javadoc-api/org/springframework/web/client/RestTemplate.html  使用使用restTemplate访问restful接口非常的简单粗暴无脑。(url, requestMap, ResponseBean.class)这三个参数分别代表 REST请求地址、请求参数、HTTP响应转换被转换成的对象类型。    

-   配置类

  ~~~java
  @Configurationpublic 
  class ApplicationContextConfig{    
  @Bean    
  //使用@LoadBalanced注解赋予RestTemplate负载均衡的能力
  //@LoadBalanced
  public RestTemplate restTemplate()    {        
    return new RestTemplate();    
  }} 
  ~~~

  控制层调用
  
  ~~~java
  @RestControllerpublic 
  class OrderController{    
  @Autowired 
  public static final String PaymentSrv_URL ="http://localhost:8001";                     
  private RestTemplate restTemplate;    
  @GetMapping("/consumer/payment/create") 
  //客户端用浏览器是get请求，但是底层实质发送post调用服务端8001    
  public CommonResult create(Payment payment) {        
      return restTemplate.postForObject(PaymentSrv_URL + "/payment/create",payment,CommonResult.class);    
  }    
  @GetMapping("/consumer/payment/get/{id}")    
  public CommonResult getPayment(@PathVariable Long id) {
      return restTemplate.getForObject(PaymentSrv_URL+"/payment/get/"+id, CommonResult.class, id);    
  }} 
  ~~~
  
  

## Eureka服务注册与发现

### Eureka基础知识

- 什么是服务治理　

  什么是服务治理Spring Cloud 封装了 Netflix 公司开发的 Eureka 模块来实现服务治理。在传统的rpc远程调用框架中，管理每个服务与服务之间依赖关系比较复杂，管理比较复杂，所以需要使用服务治理，管理服务于服务之间依赖关系，可以实现服务调用、负载均衡、容错等，实现服务发现与注册。 

- 什么是服务注册

  什么是服务注册与发现Eureka采用了CS的设计架构，Eureka Server 作为服务注册功能的服务器，它是服务注册中心。而系统中的其他微服务，使用 Eureka的客户端连接到 Eureka Server并维持心跳连接。这样系统的维护人员就可以通过 Eureka Server 来监控系统中各个微服务是否正常运行。在服务注册与发现中，有一个注册中心。当服务器启动的时候，会把当前自己服务器的信息 比如 服务地址通讯地址等以别名方式注册到注册中心上。另一方（消费者|服务提供者），以该别名的方式去注册中心上获取到实际的服务通讯地址，然后再实现本地RPC调用RPC远程调用框架核心设计思想：在于注册中心，因为使用注册中心管理每个服务与服务之间的一个依赖关系(服务治理概念)。     

- Eureka包含两个组件：Eureka Server和Eureka Client Eureka Server提供服务注册服务各个微服务节点通过配置启动后，会在EurekaServer中进行注册，这样EurekaServer中的服务注册表中将会存储所有可用服务节点的信息，服务节点的信息可以在界面中直观看到。  EurekaClient通过注册中心进行访问是一个Java客户端，用于简化Eureka Server的交互，客户端同时也具备一个内置的、使用轮询(round-robin)负载算法的负载均衡器。在应用启动后，将会向Eureka Server发送心跳(默认周期为30秒)。如果Eureka Server在多个心跳周期内没有接收到某个节点的心跳，EurekaServer将会从服务注册表中把这个服务节点移除（默认90秒）

### 单机Eureka的使用

三部曲,改pom,写yml,主启动类。

#### EurekaServer端注册中心

~~~xml
<dependency>            
  <groupId>org.springframework.cloud</groupId>            
  <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>        
</dependency>
~~~

~~~yaml
server:
  port: 7001
#eureka服务端的实例名称  
eureka:
  instance:
    hostname: localhost
  client:
  	#false表示不向注册中心注册自己。
    register-with-eureka: false
    #false表示自己端就是注册中心，我的职责就是维护服务实例，并不需要去检索服务
    fetchRegistry: false
    #设置与Eureka Server交互的地址查询服务和注册服务都需要依赖这个地址。
    service-url:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/  
~~~

主启动加入@EnableEurekaServer注解，启动服务可以看到eureka页面。

#### EurekaClient端

将注册进EurekaServer成为服务提供者provider

改pom

~~~xml
<dependency>            
  <groupId>org.springframework.cloud</groupId>            
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>        
</dependency> 
~~~

写YML

~~~yaml
eureka:
  client:
  	#表示是否将自己注册进EurekaServer默认为true。
    register-with-eureka: true
    #是否从EurekaServer抓取已有的注册信息，默认为true。单节点无所谓，集群必须设置为true才能配合ribbon使用负载均衡 
    fetch-registry: true
    service-url:
      defaultZone: http://localhost:7001/eureka
~~~

主启动加入@EnableEurekaClient注解

#### EurekaClient端

将注册进EurekaServer成为服务消费者consumer

改pom

~~~xml
<dependency>            
  <groupId>org.springframework.cloud</groupId>            
  <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>        
</dependency> 
~~~

写YML

~~~yaml
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://localhost:7001/eureka
~~~

主启动加入@EnableEurekaClient注解

最后可以再Eureka中可以看到注册的服务，**使用restTemplate调用服务时候可以直接使用注册中心的地址。**

### 集群Eureka构建

客户端需要在yml中注册除自己以外的其他服务的地址。

~~~yml
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
    service-url:
      defaultZone: 除自己以外的其他所有eureka客户端的地址
~~~

注册用户需要在yml中填写所有的eureka客户端的地址

~~~yml
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: 所有的eureka客户端的地址
~~~

### **Eureka自我保护**

- 故障现象

  概述保护模式主要用于一组客户端和Eureka Server之间存在网络异常场景下的保护。一旦进入保护模式，Eureka Server将会尝试保护其服务注册表中的信息，不再删除服务注册表中的数据，也就是不会注销任何微服务。 如果在Eureka Server的首页看到以下这段提示，则说明Eureka进入了保护模式：

  > EMERGENCY! EUREKA MAY BE INCORRECTLY CLAIMING INSTANCES ARE UP WHEN THEY'RE NOT. RENEWALS ARE LESSER THAN THRESHOLD AND HENCE THE INSTANCES ARE NOT BEING EXPIRED JUST TO BE SAFE       

- 导致原因

  为什么会产生Eureka自我保护机制？

  为了防止EurekaClient可以正常运行，但是与EurekaServer网络不通情况下，EurekaServer不会立刻将EurekaClient服务剔除

  什么是自我保护模式？

  默认情况下，如果EurekaServer在一定时间内没有接收到某个微服务实例的心跳，EurekaServer将会注销该实例（默认90秒）。但是当网络分区故障发生(延时、卡顿、拥挤)时，微服务与EurekaServer之间无法正常通信，以上行为可能变得非常危险了——因为微服务本身其实是健康的，此时本不应该注销这个微服务。Eureka通过“自我保护模式”来解决这个问题——当EurekaServer节点在短时间内丢失过多客户端时（可能发生了网络分区故障），那么这个节点就会进入自我保护模式。 在自我保护模式中，Eureka Server会保护服务注册表中的信息，不再注销任何服务实例。它的设计哲学就是宁可保留错误的服务注册信息，也不盲目注销任何可能健康的服务实例。

  一句话讲解：好死不如赖活着 

  综上，自我保护模式是一种应对网络异常的安全保护措施。它的架构哲学是宁可同时保留所有微服务（健康的微服务和不健康的微服务都会保留）也不盲目注销任何健康的微服务。使用自我保护模式，可以让Eureka集群更加的健壮、稳定。                 

  总结：某时刻某一个微服务不可用了，Eureka不会立刻清理，依旧会对该微服务的信息进行保存，属于CAP里面的AP分支。

- 怎么禁止自我保护

  注册中心eureakeServer端

  出厂默认，自我保护机制是开启的

  eureka.server.enable-self-preservation=true

  使用eureka.server.enable-self-preservation = false 可以禁用自我保护模式

  ~~~yml
  #关闭自我保护机制，保证不可用服务被及时踢除       
  enable-self-preservation: false    
  eviction-interval-timer-in-ms: 2000    
  ~~~

	关闭效果：网络有一点延迟（服务刚停），服务直接被从注册中心删除。
	
	~~~yml
	#Eureka客户端向服务端发送心跳的时间间隔，单位为秒(默认是30秒)    
	lease-renewal-interval-in-seconds: 1  
	#Eureka服务端在收到最后一次心跳后等待时间上限，单位为秒(默认是90秒)，超时将剔除服务    
	lease-expiration-duration-in-seconds: 2 
	~~~

## Zookeeper服务注册与发现

注册中心Zookeeper

- zookeeper是一个分布式协调工具，可以实现注册中心功能
- zookeeper服务器取代Eureka服务器，zk作为服务注册中心

改pom

~~~xml
<dependency>            
  <groupId>org.springframework.cloud</groupId>            
  <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId>        
</dependency>
~~~

写yml:

~~~yml
#8004表示注册到zookeeper服务器的支付服务提供者端口号
server:
  port: 8004
spring:
  application:
    #服务别名----注册zookeeper到注册中心名称
    name: cloud-provider-payment
  cloud:
    zookeeper:
      #zookeeper运行的地址
      connect-string: 127.0.0.1:2181
~~~

## Consul服务注册与发现

Consul 是一套开源的分布式服务发现和配置管理系统，由 HashiCorp 公司用 Go 语言开发。 提供了微服务系统中的服务治理、配置中心、控制总线等功能。这些功能中的每一个都可以根据需要单独使用，也可以一起使用以构建全方位的服务网格，总之Consul提供了一种完整的服务网格解决方案。

Spring Cloud Consul 具有如下特性：  

- 服务发现
  - 提供HTTP和DNS两种发现方式。

- 健康监测

  - 支持多种方式，HTTP、TCP、Docker、Shell脚本定制化监控

- KV存储

  - Key、Value的存储方式

- 多数据中心

  - Consul支持多数据中心

- 可视化Web界面

改pom

~~~xml
<dependency>            
  <groupId>org.springframework.cloud</groupId>            
  <artifactId>spring-cloud-starter-consul-discovery</artifactId>        
</dependency> 
~~~

写yml

~~~yaml
##consul注册中心地址
  cloud:
    consul:
      # 默认localhost
      host: localhost
      #默认8500
      port: 8500
      discovery:
        hostname: 127.0.0.1
        service-name: ${spring.application.name}
~~~

## 三个注册中心异同点

- CAP原则又称CAP定理，指的是在一个分布式系统中， Consistency（一致性）、 Availability（可用性）、Partition tolerance（分区容错性），三者不可得兼。

  - C:Consistency（一致性）在分布式系统中的所有数据备份，在同一时刻是否同样的值。（等同于所有节点访问同一份最新的数据副本）在分布式系统中的所有数据备份，在同一时刻是否同样的值。（等同于所有节点访问同一份最新的数据副本）
  - A:Availability（可用性）在集群中一部分节点故障后，集群整体是否还能响应客户端的读写请求。（对数据更新具备高可用性）
  - P:Partition tolerance（分区容错性）以实际效果而言，分区相当于对通信的时限要求。系统如果不能在时限内达成数据一致性，就意味着发生了分区的情况，必须就当前操作在C和A之间做出选择。
  - CAP理论关注粒度是数据，而不是整体系统设计的策略

- 经典CAP图

  最多只能同时较好的满足两个。 CAP理论的核心是：一个分布式系统不可能同时很好的满足一致性，可用性和分区容错性这三个需求，因此，根据 CAP 原理将 NoSQL 数据库分成了满足 CA 原则、满足 CP 原则和满足 AP 原则三 大类：CA - 单点集群，满足一致性，可用性的系统，通常在可扩展性上不太强大。CP - 满足一致性，分区容忍必的系统，通常性能不是特别高。AP - 满足可用性，分区容忍性的系统，通常可能对一致性要求低一些。 

  如果在某个分布式系统中数据无副本， 那么系统必然满足强一致性条件， 因为只有独一数据，不会出现数据不一致的情况，此时C和P两要素具备，但是如果系统发生了网络分区状况或者宕机，必然导致某些数据不可以访问，此时可用性条件就不能被满足，即在此情况下获得了CP系统，但是CAP不可同时满足。

  因此在进行分布式架构设计时，必须做出取舍。当前一般是通过分布式缓存中各节点的最终一致性来提高系统的性能，通过使用多节点之间的数据异步复制技术来实现集群化的数据一致性。

  - AP(Eureka)

    AP架构当网络分区出现后，为了保证可用性，系统B可以返回旧值，保证系统的可用性。结论：违背了一致性C的要求，只满足可用性和分区容错，即AP   
  
  - CP(Zookeeper/Consul)
  
    CP架构当网络分区出现后，为了保证一致性，就必须拒接请求，否则无法保证一致性结论：违背了可用性A的要求，只满足一致性和分区容错，即CP  

## Ribbon负载均衡服务调用

### 概述

- 是什么

  Spring Cloud Ribbon是基于Netflix Ribbon实现的一套客户端负载均衡的工具，主要功能是提供客户端的软件负载均衡算法和服务调用。Ribbon客户端组件提供一系列完善的配置项如连接超时，重试等。简单的说，就是在配置文件中列出Load Balancer（简称LB）后面所有的机器，Ribbon会自动的帮助你基于某种规则（如简单轮询，随机连接等）去连接这些机器。我们很容易使用Ribbon实现自定义的负载均衡算法。                               

- 能干吗

  - LB（负载均衡）

    LB负载均衡(Load Balance)是什么简单的说就是将用户的请求平摊的分配到多个服务上，从而达到系统的HA（高可用）。常见的负载均衡有软件Nginx，LVS，硬件 F5等。 Ribbon本地负载均衡客户端 VS Nginx服务端负载均衡区别 Nginx是服务器负载均衡，客户端所有请求都会交给nginx，然后由nginx实现转发请求。即负载均衡是由服务端实现的。  Ribbon本地负载均衡，在调用微服务接口时候，会在注册中心上获取注册信息服务列表之后缓存到JVM本地，从而在本地实现RPC远程服务调用技术。         

    - 集中式LB

      集中式LB即在服务的消费方和提供方之间使用独立的LB设施(可以是硬件，如F5, 也可以是软件，如nginx), 由该设施负责把访问请求通过某种策略转发至服务的提供方；

    - 进程内LB

      进程内LB 将LB逻辑集成到消费方，消费方从服务注册中心获知有哪些地址可用，然后自己再从这些地址中选择出一个合适的服务器。 Ribbon就属于进程内LB，它只是一个类库，集成于消费方进程，消费方通过它来获取到服务提供方的地址。  

  - 一句话

    - 负载均衡+RestTemplate调用

### Ribbon负载均衡演示

架构说明

Ribbon在工作时分成两步第一步先选择 EurekaServer ,它优先选择在同一个区域内负载较少的server.第二步再根据用户指定的策略，在从server取到的服务注册列表中选择一个地址。其中Ribbon提供了多种策略：比如轮询、随机和根据响应时间加权。            

总结：Ribbon其实就是一个软负载均衡的客户端组件，
他可以和其他所需请求的客户端结合使用，和eureka结合只是其中的一个实例。

二说RestTemplate的使用

- getForObject方法/getForEntity方法

  返回对象为响应体中数据转化成的对象，基本上可以理解为Json 返回对象为ResponseEntity对象，包含了响应中的一些重要信息，比如响应头、响应状态码、响应体等

- postForObject/postForEntity

- GET请求方法

  T getForObject(String url, Class responseType,Object... uriVariables);

  T getForObject(String url, Class responseType,Map<String, ?> uriVariables);

  T getForObject(URI url, Class responseType);

  ResponseEntity getForEntity(String url, Class responseType,Object... uriVariables);

  ResponseEntity getForEntity(String url, Class responseType,Map<String, ?> uriVariables);

  ResponseEntity getForEntity(URI var1, Class responseType);

- POST请求方法

  T postForObject(String url, @Nullable Object request, Class   responseType, Object... uriVariables);

  T postForObject(String url, @Nullable Object request, Class   responseType, Map<String, ?> uriVariables);

  T postForObject(URI url, @Nullable Object request, Class   responseType);

  ResponseEntity postForEntity(String url, @Nullable Object request, Class   responseType, Object... uriVariables);   ResponseEntity postForEntity(String url, @Nullable Object request, Class   responseType, Map<String, ?> uriVariables);

  ResponseEntity   postForEntity(URI url, @Nullable Object request, Class   responseType);

### Ribbon核心组件IRule

IRule：根据特定算法中从服务列表中选取一个要访问的服务

- com.netflix.loadbalancer.RoundRobinRule

  轮询

- com.netflix.loadbalancer.RandomRule

  随机

- com.netflix.loadbalancer.RetryRule

  先按照RoundRobinRule的策略获取服务，如果获取服务失败则在指定时间内会进行重试，获取可用的服务

- WeightedResponseTimeRule

  对RoundRobinRule的扩展，响应速度越快的实例选择权重越大，越容易被选择

- BestAvailableRule

  会先过滤掉由于多次访问故障而处于断路器跳闸状态的服务，然后选择一个并发量最小的服务

- AvailabilityFilteringRule

  先过滤掉故障实例，再选择并发较小的实例

- ZoneAvoidanceRule

  默认规则,复合判断server所在区域的性能和server的可用性选择服务器

如何替换

官方文档明确给出了警告：这个自定义配置类不能放在@ComponentScan所扫描的当前包下以及子包下，否则我们自定义的这个配置类就会被所有的Ribbon客户端所共享，达不到特殊化定制的目的了。    

新建package，上面包下新建MySelfRule规则类

~~~java
@Configuration
public class MySelfRule {
    @Bean
    public IRule myRule(){
        return new RandomRule();
    }
}
~~~

主启动类添加注解

~~~java
@RibbonClient(name = "CLOUD-PAYMENT-SERVICE",configuration = MySelfRule.class)
~~~

原理

负载均衡算法：

rest接口第几次请求数 % 服务器集群总数量 = 实际调用服务器位置下标  ，每次服务重启动后rest接口计数从1开始 

~~~java
List<ServiceInstance> instances = discoveryClient.getInstances("CLOUD-PAYMENT-SERVICE");
~~~

当集群总数为2， 按照轮询算法原理： 当总请求数为1时： 1 % 2 =1 对应下标位置为1 ，则获得服务地址为127.0.0.1:8001当总请求数位2时： 2 % 2 =0 对应下标位置为0 ，则获得服务地址为127.0.0.1:8002当总请求数位3时： 3 % 2 =1 对应下标位置为1 ，则获得服务地址为127.0.0.1:8001当总请求数位4时： 4 % 2 =0 对应下标位置为0 ，则获得服务地址为127.0.0.1:8002如此类推......     

## OpenFeign服务接口调用

### 使用

- OpenFeign是什么

  Feign是一个声明式WebService客户端。使用Feign能让编写Web Service客户端更加简单。它的使用方法是定义一个服务接口然后在上面添加注解。Feign也支持可拔插式的编码器和解码器。Spring Cloud对Feign进行了封装，使其支持了Spring MVC标准注解和HttpMessageConverters。Feign可以与Eureka和Ribbon组合使用以支持负载均衡 。 Feign是一个声明式的Web服务客户端，让编写Web服务客户端变得非常容易，只需创建一个接口并在接口上添加注解即可。

- 能干嘛

  Feign能干什么Feign旨在使编写Java Http客户端变得更容易。前面在使用Ribbon+RestTemplate时，利用RestTemplate对http请求的封装处理，形成了一套模版化的调用方法。但是在实际开发中，由于对服务依赖的调用可能不止一处，往往一个接口会被多处调用，所以通常都会针对每个微服务自行封装一些客户端类来包装这些依赖服务的调用。所以，Feign在此基础上做了进一步封装，由他来帮助我们定义和实现依赖服务接口的定义。在Feign的实现下，我们只需创建一个接口并使用注解的方式来配置它(以前是Dao接口上面标注Mapper注解,现在是一个微服务接口上面标注一个Feign注解即可)，即可完成对服务提供方的接口绑定，简化了使用Spring cloud Ribbon时，自动封装服务调用客户端的开发量。Feign集成了Ribbon利用Ribbon维护了Payment的服务列表信息，并且通过轮询实现了客户端的负载均衡。而与Ribbon不同的是，通过feign只需要定义服务绑定接口且以声明式的方法，优雅而简单的实现了服务调用

- Feign和OpenFeign两者区别

  FeignOpenFeignFeign是Spring Cloud组件中的一个轻量级RESTful的HTTP服务客户端Feign内置了Ribbon，用来做客户端负载均衡，去调用服务注册中心的服务。Feign的使用方式是：使用Feign的注解定义接口，调用这个接口，就可以调用服务注册中心的服务OpenFeign是Spring Cloud 在Feign的基础上支持了SpringMVC的注解，如@RequesMapping等等。OpenFeign的@FeignClient可以解析SpringMVC的@RequestMapping注解下的接口，并通过动态代理的方式产生实现类，实现类中做负载均衡并调用其他服务。

改POM

~~~xml
 <dependency>            
   <groupId>org.springframework.cloud</groupId>            
   <artifactId>spring-cloud-starter-openfeign</artifactId>        
</dependency> 
~~~

主启动

@EnableFeignClients

新建业务逻辑接口包，新建服务

~~~java
@Component
@FeignClient(value = "CLOUD-PAYMENT-SERVICE")
public interface PaymentFeignService{    
  // 信息一致
	@GetMapping(value = "/payment/get/{id}")    
	CommonResult<Payment> getPaymentById(@PathVariable("id") Long id);
}
~~~

控制层直接使用，Feign自带负载均衡配置项。

### OpenFeign超时控制

默认Feign客户端只等待一秒钟，但是服务端处理需要超过1秒钟，导致Feign客户端不想等待了，直接返回报错。为了避免这样的情况，有时候我们需要设置Feign客户端的超时控制。yml文件中开启配置 。

~~~yaml
#设置feign客户端超时时间(OpenFeign默认支持ribbon)
ribbon:
	#指的是建立连接所用的时间，适用于网络状况正常的情况下,两端连接所用的时间  
	ReadTimeout: 5000
	#指的是建立连接后从服务器读取到可用资源所用的时间  
	ConnectTimeout: 5000  
~~~

### OpenFign日志打印

- 是什么

  Feign 提供了日志打印功能，我们可以通过配置来调整日志级别，从而了解 Feign 中 Http 请求的细节。说白了就是对Feign接口的调用情况进行监控和输出  

- 日志级别

  NONE：默认的，不显示任何日志；

  BASIC：仅记录请求方法、URL、响应状态码及执行时间；

  HEADERS：除了 BASIC 中定义的信息之外，还有请求和响应的头信息；

  FULL：除了 HEADERS 中定义的信息之外，还有请求和响应的正文及元数据。

- 配置日志bean

  ~~~java
  @Configurationpublic 
  class FeignConfig{    
    @Bean    
    Logger.Level feignLoggerLevel()	{        
      return Logger.Level.FULL;    
  }} 
  ~~~

- YML文件里需要开启日志的Feign客户端

  ~~~yml
  # feign日志以什么级别监控哪个接口 
  logging:
    level:
      com.example.openfeignOrder.service.PaymentFeignService: debug 

- 后台日志查看

## Hystrix断路器

- 分布式系统面临的问题

  分布式系统面临的问题复杂分布式体系结构中的应用程序有数十个依赖关系，每个依赖关系在某些时候将不可避免地失败。 服务雪崩多个微服务之间调用的时候，假设微服务A调用微服务B和微服务C，微服务B和微服务C又调用其它的微服务，这就是所谓的“扇出”。如果扇出的链路上某个微服务的调用响应时间过长或者不可用，对微服务A的调用就会占用越来越多的系统资源，进而引起系统崩溃，所谓的“雪崩效应”. 对于高流量的应用来说，单一的后端依赖可能会导致所有服务器上的所有资源都在几秒钟内饱和。比失败更糟糕的是，这些应用程序还可能导致服务之间的延迟增加，备份队列，线程和其他系统资源紧张，导致整个系统发生更多的级联故障。这些都表示需要对故障和延迟进行隔离和管理，以便单个依赖关系的失败，不能取消整个应用程序或系统。所以，通常当你发现一个模块下的某个实例失败后，这时候这个模块依然还会接收流量，然后这个有问题的模块还调用了其他的模块，这样就会发生级联故障，或者叫雪崩。          

- 是什么

  Hystrix是一个用于处理分布式系统的延迟和容错的开源库，在分布式系统里，许多依赖不可避免的会调用失败，比如超时、异常等，Hystrix能够保证在一个依赖出问题的情况下，不会导致整体服务失败，避免级联故障，以提高分布式系统的弹性。 “断路器”本身是一种开关装置，当某个服务单元发生故障之后，通过断路器的故障监控（类似熔断保险丝），向调用方返回一个符合预期的、可处理的备选响应（FallBack），而不是长时间的等待或者抛出调用方无法处理的异常，这样就保证了服务调用方的线程不会被长时间、不必要地占用，从而避免了故障在分布式系统中的蔓延，乃至雪崩。     

- 能干嘛

  - 服务降级
  - 服务熔断
  - 接近实时的监控

### **Hystrix重要概念**

- 服务降级

  - 服务器忙，请稍后再试，不让客户端等待并立刻返回一个友好提示，fallback
  - 哪些情况会出发降级

    - 程序运行异常
    - 超时
    - 服务熔断触发服务降级
    - 线程池/信号量打满也会导致服务降级

- 服务熔断

  - 类比保险丝达到最大服务访问后，直接拒绝访问，拉闸限电，然后调用服务降级的方法并返回友好提示
  - 就是保险丝

    - 服务的降级->进而熔断->恢复调用链路

- 服务限流

  - 秒杀高并发等操作，严禁一窝蜂的过来拥挤，大家排队，一秒钟N个，有序进行

### 服务降级

改POM

~~~xml
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-netflix-hystrix-dashboard</artifactId>
</dependency>
~~~

服务注册主启动，在高并发环境中，大量的请求会导致后来的请求无法访问，一直转圈圈进不去，用户体验不好，所以对服务进行降级。长时间未请求到业务进行降级，自定义方法进行兜底，降级到一定程度后服务熔断。

如何解决？

- 超时导致服务器变慢(转圈)

  超时不再等待

- 出错(宕机或程序运行出错)

  出错要有兜底

- 解决

  -  对方服务(8001)超时了，调用者(80)不能一直卡死等待，必须有服务降级
  -  对方服务(8001)down机了，调用者(80)不能一直卡死等待，必须有服务降级
  -  对方服务(8001)OK，调用者(80)自己出故障或有自我要求（自己的等待时间小于服务提供者),自己处理降级

**服务降级**

先从自身找问题，设置自身调用超时时间的峰值，峰值内可以正常运行，超过了需要有兜底的方法处理，作服务降级fallback

~~~java
@HystrixCommand(fallbackMethod = "paymentInfo_TimeOutHandler",commandProperties = {            @HystrixProperty(name="execution.isolation.thread.timeoutInMilliseconds",value="3000")})   

public String paymentInfo_TimeOutHandler(Integer id){        
  return "调用支付接口超时或异常：\t"+ "\t当前线程池名字" + Thread.currentThread().getName();    
}} 

// 主启动类添加启动注解
@EnableCircuitBreaker
~~~

@HystrixCommand报异常后如何处理

一旦调用服务方法失败并抛出了错误信息后，会自动调用@HystrixCommand标注好的fallbackMethod调用类中的指定方法

服务调用端也可以对服务进行降级。

问题：代码耦合度大

1. 可以在服务调用处加上

   > // 全局使用统一兜底。
   >
   > @DefaultProperties(defaultFallback = "payment_Global_FallbackMethod")

   

2. 可以新建类集成Feign接口

   ~~~java
   @Component 
   public class PaymentFallbackService implements PaymentFeignClientService{    
   @Override    
   public String getPaymentInfo(Integer id)    {        
   	return "服务调用失败，提示来自：cloud-consumer-feign-order80";    }
   }   
   ~~~

### 服务熔断

熔断机制概述熔断机制是应对雪崩效应的一种微服务链路保护机制。当扇出链路的某个微服务出错不可用或者响应时间太长时，会进行服务的降级，进而熔断该节点微服务的调用，快速返回错误的响应信息。当检测到该节点微服务调用响应正常后，恢复调用链路。

Hystrix会监控微服务间调用的状况，当失败的调用到一定阈值，缺省是5秒内20次调用失败，就会启动熔断机制。熔断机制的注解是@HystrixCommand。      

使用：

~~~java
@HystrixCommand(fallbackMethod = "paymentCircuitBreaker_fallback",commandProperties = {        @HystrixProperty(name = "circuitBreaker.enabled",value = "true"),        
@HystrixProperty(name = "circuitBreaker.requestVolumeThreshold",value = "10"),        
@HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds",value = "10000"),        
@HystrixProperty(name = "circuitBreaker.errorThresholdPercentage",value = "60"),})
~~~

熔断类型

- 熔断打开

  请求不再进行调用当前服务，内部设置时钟一般为MTTR（平均故障处理时间)，当打开时长达到所设时钟则进入半熔断状态

- 熔断关闭

  熔断关闭不会对服务进行熔断

- 熔断半开

  部分请求根据规则调用当前服务，如果请求成功且符合规则则认为当前服务恢复正常，关闭熔断

涉及到断路器的三个重要参数：快照时间窗、请求总数阀值、错误百分比阀值。

1. 快照时间窗：断路器确定是否打开需要统计一些请求和错误数据，而统计的时间范围就是快照时间窗，默认为最近的10秒。 
2. 请求总数阀值：在快照时间窗内，必须满足请求总数阀值才有资格熔断。默认为20，意味着在10秒内，如果该hystrix命令的调用次数不足20次，即使所有的请求都超时或其他原因失败，断路器都不会打开。 
3. 错误百分比阀值：当请求总数在快照时间窗内超过了阀值，比如发生了30次调用，如果在这30次调用中，有15次发生了超时异常，也就是超过50%的错误百分比，在默认设定50%阀值情况下，这时候就会将断路器打开。  

断路器开启或者关闭的条件

当满足一定的阀值的时候（默认10秒内超过20个请求次数）
当失败率达到一定的时候（默认10秒内超过50%的请求失败）
到达以上阀值，断路器将会开启
当开启的时候，所有请求都不会进行转发
一段时间之后（默认是5秒），这个时候断路器是半开状态，会让其中一个请求进行转发。
如果成功，断路器会关闭，若失败，继续开启。重复4和5

断路器打开之后

1. 再有请求调用的时候，将不会调用主逻辑，而是直接调用降级fallback。通过断路器，实现了自动地发现错误并将降级逻辑切换为主逻辑，减少响应延迟的效果。
2. 原来的主逻辑要如何恢复呢？对于这一问题，hystrix也为我们实现了自动恢复功能。当断路器打开，对主逻辑进行熔断之后，hystrix会启动一个休眠时间窗，在这个时间窗内，降级逻辑是临时的成为主逻辑，当休眠时间窗到期，断路器将进入半开状态，释放一次请求到原来的主逻辑上，如果此次请求正常返回，那么断路器将继续闭合，主逻辑恢复，如果这次请求依然有问题，断路器继续进入打开状态，休眠时间窗重新计时。

## Gateway网关

### **三大核心概念**

- Route(路由)

  - 路由是构建网关的基本模块，它由ID，目标URI，一系列的断言和过滤器组成，如果断言为true则匹配该路由

- Predicate(断言)

  - 参考的是Java8的java.util.function.Predicate
    开发人员可以匹配HTTP请求中的所有内容(例如请求头或请求参数)，如果请求与断言相匹配则进行路由

- Filter(过滤)

  - 指的是Spring框架中GatewayFilter的实例，使用过滤器，可以在请求被路由前或者之后对请求进行修改。

- 总体

  web请求，通过一些匹配条件，定位到真正的服务节点。并在这个转发过程的前后，进行一些精细化控制。predicate就是我们的匹配条件；而filter，就可以理解为一个无所不能的拦截器。有了这两个元素，再加上目标uri，就可以实现一个具体的路由了 

### Gateway工作流程

客户端向 Spring Cloud Gateway 发出请求。然后在 Gateway Handler Mapping 中找到与请求相匹配的路由，将其发送到 Gateway Web Handler。 Handler 再通过指定的过滤器链来将请求发送到我们实际的服务执行业务逻辑，然后返回。过滤器之间用虚线分开是因为过滤器可能会在发送代理请求之前（“pre”）或之后（“post”）执行业务逻辑。 Filter在“pre”类型的过滤器可以做参数校验、权限校验、流量监控、日志输出、协议转换等，在“post”类型的过滤器中可以做响应内容、响应头的修改，日志的输出，流量监控等有着非常重要的作用。 

核心逻辑，路由转发+执行过滤器链

### Gateway使用

Gateway使用主要是在yml文件中进行路由配置。eg:

~~~yml
cloud:
    gateway:
      discovery:
        locator:
          enabled: true  #开启从注册中心动态创建路由的功能，利用微服务名进行路由
      routes:
        - id: payment_routh #路由的ID，没有固定规则但要求唯一，建议配合服务名
          #uri: http://localhost:8001   #匹配后提供服务的路由地址
         	# 根据服务名进行负载均衡调用
          uri: lb://cloud-payment-service
          predicates:
            - Path=/payment/get/**   #断言,路径相匹配的进行路由
 
        - id: test_routh
          #uri: http://localhost:8002   #匹配后提供服务的路由地址
          # 根据服务名进行负载均衡调用
          uri: lb://cloud-test-service
          predicates:
            - Path=/test/lb/**   #断言,路径相匹配的进行路由
~~~

### 常用的Route Predicate

1. After Route Predicate

   在某个时间之后

2. Before Route Predicate

   在某个时间之前

3. Between Route Predicate

   在一段时间之间能进行访问

4. Cookie Route Predicate

   带有cookie

5. Header Route Predicate

   带有header

6. Host Route Predicate

   带有host

7. Method Route Predicate

8. Path Route Predicate

9. Query Route Predicate

~~~yml
cloud:
    gateway:
      discovery:
        locator:
          enabled: true  #开启从注册中心动态创建路由的功能，利用微服务名进行路由
      routes:
        - id: payment_routh #路由的ID，没有固定规则但要求唯一，建议配合服务名
          #uri: http://localhost:8001   #匹配后提供服务的路由地址
         	# 根据服务名进行负载均衡调用
          uri: lb://cloud-payment-service
          predicates:
            - Path=/payment/get/**   #断言,路径相匹配的进行路由
            #- After=2020-03-08T10:59:34.102+08:00[Asia/Shanghai] #时间到了才能访问
            #- Cookie=username,zhangshuai #并且Cookie是username=zhangshuai才能访问
            #- Header=X-Request-Id, \d+ #请求头中要有X-Request-Id属性并且值为整数的正则表达式
            #- Host=**.test.com
            #- Method=GET
            #- Query=username, \d+ #要有参数名称并且是正整数才能路由
~~~

### GatewayFilter

~~~yml
routes:
	- id: payment_routh #路由的ID，没有固定规则但要求唯一，建议配合服务名
  	filters:
    	- AddRequestHeader=X-Request-red, blue # 过滤器工厂会在匹配的请求头上加上一对请求头
  	uri: lb://cloud-payment-service
  	predicates:
    	- Path=/payment/get/**   #断言,路径相匹配的进行路由
~~~

[详见官网](https://docs.spring.io/spring-cloud-gateway/docs/3.1.3/reference/html/#gatewayfilter-factories)

### 自定义过滤器

自定义全局GlobalFilter

两个主要接口介绍  GlobalFilter ，Ordered

使用：

~~~java
@Component
@Slf4j
public class MyLogGateWayFilter implements GlobalFilter,Ordered {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        log.info("*********come in MyLogGateWayFilter: "+new Date());
        String uname = exchange.getRequest().getQueryParams().getFirst("username");
        if(StringUtils.isEmpty(uname)){
            log.info("*****用户名为Null 非法用户,(┬＿┬)");
            exchange.getResponse().setStatusCode(HttpStatus.NOT_ACCEPTABLE);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
~~~