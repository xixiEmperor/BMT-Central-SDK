# NestJS 入门指南

## 目录
1. [什么是 NestJS](#什么是-nestjs)
2. [NestJS vs Express](#nestjs-vs-express)
3. [环境搭建](#环境搭建)
4. [核心概念](#核心概念)
5. [创建第一个应用](#创建第一个应用)
6. [控制器 (Controllers)](#控制器-controllers)
7. [服务 (Services)](#服务-services)
8. [模块 (Modules)](#模块-modules)
9. [依赖注入](#依赖注入)
10. [中间件 (Middleware)](#中间件-middleware)
11. [管道 (Pipes)](#管道-pipes)
12. [守卫 (Guards)](#守卫-guards)
13. [拦截器 (Interceptors)](#拦截器-interceptors)
14. [异常过滤器 (Exception Filters)](#异常过滤器-exception-filters)
15. [数据库集成](#数据库集成)
16. [测试](#测试)
17. [部署](#部署)

## 什么是 NestJS

NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架。它使用现代 JavaScript，完全支持 TypeScript，并结合了 OOP（面向对象编程）、FP（函数式编程）和 FRP（函数响应式编程）的元素。

### 核心特点

- **TypeScript 优先**: 虽然也支持纯 JavaScript，但 NestJS 是为 TypeScript 而生的
- **装饰器驱动**: 大量使用装饰器来定义路由、依赖注入等
- **模块化架构**: 应用程序被组织成模块，便于维护和扩展
- **依赖注入**: 内置强大的依赖注入系统
- **Express/Fastify 兼容**: 底层可以使用 Express 或 Fastify

## NestJS vs Express

作为有 Express 基础的开发者，了解两者的区别很重要：

### Express 的特点
```javascript
// Express 示例
const express = require('express');
const app = express();

app.get('/users', (req, res) => {
  // 直接处理业务逻辑
  const users = getUsersFromDatabase();
  res.json(users);
});

app.listen(3000);
```

### NestJS 的特点
```typescript
// NestJS 示例
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): User[] {
    // 业务逻辑委托给服务层
    return this.usersService.findAll();
  }
}
```

### 主要区别

| 特性 | Express | NestJS |
|------|---------|--------|
| 架构 | 简单、灵活 | 结构化、模块化 |
| TypeScript | 需要额外配置 | 原生支持 |
| 依赖注入 | 需要第三方库 | 内置支持 |
| 装饰器 | 不支持 | 大量使用 |
| 学习曲线 | 平缓 | 较陡峭 |
| 项目规模 | 适合小到中型 | 适合中到大型 |

## 环境搭建

### 前置要求
- Node.js (版本 >= 16)
- npm 或 yarn 或 pnpm

### 安装 NestJS CLI
```bash
npm install -g @nestjs/cli
```

### 创建新项目
```bash
nest new my-nest-app
cd my-nest-app
npm run start:dev
```

### 项目结构
```
src/
├── app.controller.spec.ts  # 控制器测试文件
├── app.controller.ts       # 应用控制器
├── app.module.ts          # 应用根模块
├── app.service.ts         # 应用服务
└── main.ts               # 应用入口文件
```

## 核心概念

### 1. 装饰器 (Decorators)
装饰器是 NestJS 的核心特性，用于添加元数据：

```typescript
// 类装饰器
@Controller('cats')
export class CatsController {}

// 方法装饰器
@Get()
findAll() {}

// 参数装饰器
findOne(@Param('id') id: string) {}

// 属性装饰器
@Injectable()
export class CatsService {
  @Inject('DATABASE_CONNECTION')
  private connection: Connection;
}
```

### 2. 依赖注入 (Dependency Injection)
NestJS 使用依赖注入来管理类之间的依赖关系：

```typescript
// 服务提供者
@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    this.cats.push(cat);
  }

  findAll(): Cat[] {
    return this.cats;
  }
}

// 消费者
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}
  // NestJS 会自动注入 CatsService 实例
}
```

## 创建第一个应用

让我们创建一个简单的任务管理 API：

### 1. 定义数据模型
```typescript
// src/tasks/task.interface.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}
```

### 2. 创建 DTO (数据传输对象)
```typescript
// src/tasks/dto/create-task.dto.ts
export class CreateTaskDto {
  title: string;
  description: string;
}

// src/tasks/dto/update-task-status.dto.ts
import { TaskStatus } from '../task.interface';

export class UpdateTaskStatusDto {
  status: TaskStatus;
}
```

## 控制器 (Controllers)

控制器负责处理传入的请求并返回响应给客户端。

### 基本控制器
```typescript
// src/tasks/tasks.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './task.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  getAllTasks(): Task[] {
    return this.tasksService.getAllTasks();
  }

  @Get('/:id')
  getTaskById(@Param('id') id: string): Task {
    return this.tasksService.getTaskById(id);
  }

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto): Task {
    return this.tasksService.createTask(createTaskDto);
  }

  @Delete('/:id')
  deleteTask(@Param('id') id: string): void {
    return this.tasksService.deleteTask(id);
  }

  @Patch('/:id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ): Task {
    const { status } = updateTaskStatusDto;
    return this.tasksService.updateTaskStatus(id, status);
  }
}
```

### 常用装饰器说明

#### 路由装饰器
```typescript
@Get()           // GET 请求
@Post()          // POST 请求
@Put()           // PUT 请求
@Delete()        // DELETE 请求
@Patch()         // PATCH 请求
@Options()       // OPTIONS 请求
@Head()          // HEAD 请求
@All()           // 所有 HTTP 方法
```

#### 参数装饰器
```typescript
@Param('id')           // 路径参数
@Query('search')       // 查询参数
@Body()               // 请求体
@Headers('authorization') // 请求头
@Req()                // 请求对象
@Res()                // 响应对象
```

### 与 Express 对比
```typescript
// Express 写法
app.get('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const task = tasksService.getTaskById(id);
  res.json(task);
});

// NestJS 写法
@Get('/:id')
getTaskById(@Param('id') id: string): Task {
  return this.tasksService.getTaskById(id);
}
```

## 服务 (Services)

服务是用来处理业务逻辑的类，通常被控制器调用。

```typescript
// src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Task, TaskStatus } from './task.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  getAllTasks(): Task[] {
    return this.tasks;
  }

  getTaskById(id: string): Task {
    const found = this.tasks.find(task => task.id === id);
    
    if (!found) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    
    return found;
  }

  createTask(createTaskDto: CreateTaskDto): Task {
    const { title, description } = createTaskDto;
    
    const task: Task = {
      id: uuid(),
      title,
      description,
      status: TaskStatus.OPEN,
      createdAt: new Date(),
    };
    
    this.tasks.push(task);
    return task;
  }

  deleteTask(id: string): void {
    const found = this.getTaskById(id);
    this.tasks = this.tasks.filter(task => task.id !== found.id);
  }

  updateTaskStatus(id: string, status: TaskStatus): Task {
    const task = this.getTaskById(id);
    task.status = status;
    return task;
  }

  getTasksWithFilters(status: TaskStatus, search: string): Task[] {
    let tasks = this.getAllTasks();

    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    if (search) {
      tasks = tasks.filter(task =>
        task.title.includes(search) ||
        task.description.includes(search)
      );
    }

    return tasks;
  }
}
```

### 服务的特点
1. **@Injectable() 装饰器**: 标记类可以被依赖注入系统管理
2. **单一职责**: 每个服务应该专注于特定的业务逻辑
3. **可测试性**: 服务可以独立测试，不依赖于 HTTP 层

## 模块 (Modules)

模块是组织应用程序的基本单位，每个应用程序至少有一个根模块。

### 功能模块
```typescript
// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService], // 如果其他模块需要使用 TasksService
})
export class TasksModule {}
```

### 根模块
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [TasksModule],
})
export class AppModule {}
```

### 模块的组成部分
- **providers**: 可以被注入的服务
- **controllers**: 处理 HTTP 请求的控制器
- **imports**: 导入其他模块
- **exports**: 导出供其他模块使用的提供者

### 动态模块
```typescript
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_OPTIONS',
          useValue: options,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
      global: true,
    };
  }
}
```

## 依赖注入

NestJS 的依赖注入系统是其核心特性之一。

### 基本用法
```typescript
// 服务提供者
@Injectable()
export class CatsService {
  findAll(): string {
    return 'This action returns all cats';
  }
}

// 消费者
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  findAll(): string {
    return this.catsService.findAll();
  }
}
```

### 自定义提供者
```typescript
// 值提供者
const connectionProvider = {
  provide: 'CONNECTION',
  useValue: connection,
};

// 类提供者
const configServiceProvider = {
  provide: ConfigService,
  useClass: process.env.NODE_ENV === 'development' 
    ? DevelopmentConfigService 
    : ProductionConfigService,
};

// 工厂提供者
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};
```

### 注入作用域
```typescript
@Injectable({ scope: Scope.REQUEST })
export class CatsService {}

// 作用域类型：
// - DEFAULT: 单例模式（默认）
// - REQUEST: 每个请求创建新实例
// - TRANSIENT: 每次注入都创建新实例
```

## 中间件 (Middleware)

中间件是在路由处理程序之前调用的函数，类似于 Express 中间件。

### 函数式中间件
```typescript
// src/common/middleware/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
}
```

### 类中间件
```typescript
// src/common/middleware/logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  }
}
```

### 应用中间件
```typescript
// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats'); // 只对 cats 路由应用
    
    // 或者更具体的配置
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
```

### 全局中间件
```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './common/middleware/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(logger); // 全局应用
  await app.listen(3000);
}
bootstrap();
```

## 管道 (Pipes)

管道用于数据转换和验证。

### 内置管道
```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}

// 内置管道类型：
// - ValidationPipe: 验证管道
// - ParseIntPipe: 转换为整数
// - ParseFloatPipe: 转换为浮点数
// - ParseBoolPipe: 转换为布尔值
// - ParseArrayPipe: 转换为数组
// - ParseUUIDPipe: 验证 UUID
// - ParseEnumPipe: 验证枚举值
// - DefaultValuePipe: 设置默认值
```

### 验证管道
首先安装验证相关包：
```bash
npm install class-validator class-transformer
```

创建 DTO 并添加验证规则：
```typescript
// src/tasks/dto/create-task.dto.ts
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;
}
```

应用验证管道：
```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // 自动删除非 DTO 属性
    forbidNonWhitelisted: true, // 如果有非白名单属性则抛出错误
    transform: true, // 自动转换类型
  }));
  await app.listen(3000);
}
```

### 自定义管道
```typescript
// src/common/pipes/parse-int.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}

// 使用自定义管道
@Get(':id')
findOne(@Param('id', new ParseIntPipe()) id: number) {
  return this.catsService.findOne(id);
}
```

## 守卫 (Guards)

守卫用于决定请求是否应该被处理，通常用于身份验证和授权。

### 基本守卫
```typescript
// src/common/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private validateRequest(request: any): boolean {
    // 验证逻辑，例如检查 JWT token
    const token = request.headers.authorization;
    return token && token.startsWith('Bearer ');
  }
}
```

### 基于角色的守卫
```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 创建角色装饰器
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 使用守卫和装饰器
@Controller('cats')
@UseGuards(AuthGuard, RolesGuard)
export class CatsController {
  @Post()
  @Roles('admin')
  create(@Body() createCatDto: CreateCatDto) {
    // 只有管理员可以创建
  }
}
```

### 应用守卫
```typescript
// 控制器级别
@Controller('cats')
@UseGuards(AuthGuard)
export class CatsController {}

// 方法级别
@Get()
@UseGuards(AuthGuard)
findAll() {}

// 全局级别 (main.ts)
app.useGlobalGuards(new AuthGuard());
```

## 拦截器 (Interceptors)

拦截器可以在方法执行前后添加额外的逻辑。

### 基本拦截器
```typescript
// src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
      );
  }
}
```

### 转换响应拦截器
```typescript
// src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  message: string;
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        data,
        message: 'Success',
        statusCode: context.switchToHttp().getResponse().statusCode,
      })),
    );
  }
}
```

### 缓存拦截器
```typescript
// src/common/interceptors/cache.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = request.url;

    if (this.cache.has(key)) {
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap(response => this.cache.set(key, response)),
    );
  }
}
```

## 异常过滤器 (Exception Filters)

异常过滤器用于处理应用程序中抛出的异常。

### 基本异常过滤器
```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exception.message,
      });
  }
}
```

### 全局异常过滤器
```typescript
// src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}

// 在 main.ts 中应用
app.useGlobalFilters(new AllExceptionsFilter());
```

### 自定义异常
```typescript
// src/common/exceptions/forbidden.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class ForbiddenException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}

// 使用自定义异常
@Get()
findAll() {
  throw new ForbiddenException();
}
```

## 数据库集成

### TypeORM 集成

安装依赖：
```bash
npm install @nestjs/typeorm typeorm mysql2
```

配置数据库连接：
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'taskmanagement',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 生产环境应设为 false
    }),
    TasksModule,
  ],
})
export class AppModule {}
```

创建实体：
```typescript
// src/tasks/task.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { TaskStatus } from './task-status.enum';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.OPEN,
  })
  status: TaskStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  userId: string;
}
```

创建仓库服务：
```typescript
// src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async getAllTasks(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({ where: { userId } });
  }

  async getTaskById(id: string, userId: string): Promise<Task> {
    const found = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!found) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return found;
  }

  async createTask(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
      userId,
    });

    await this.tasksRepository.save(task);
    return task;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const result = await this.tasksRepository.delete({ id, userId });

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

  async updateTaskStatus(id: string, status: TaskStatus, userId: string): Promise<Task> {
    const task = await this.getTaskById(id, userId);
    task.status = status;
    await this.tasksRepository.save(task);
    return task;
  }
}
```

更新模块：
```typescript
// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
```

### Mongoose 集成 (MongoDB)

安装依赖：
```bash
npm install @nestjs/mongoose mongoose
```

配置连接：
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest'),
    CatsModule,
  ],
})
export class AppModule {}
```

创建 Schema：
```typescript
// src/cats/schemas/cat.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CatDocument = Cat & Document;

@Schema()
export class Cat {
  @Prop({ required: true })
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
```

## 测试

NestJS 提供了强大的测试工具。

### 单元测试
```typescript
// src/cats/cats.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CatsService } from './cats.service';

describe('CatsService', () => {
  let service: CatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CatsService],
    }).compile();

    service = module.get<CatsService>(CatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of cats', () => {
      const result = ['test'];
      jest.spyOn(service, 'findAll').mockImplementation(() => result);

      expect(service.findAll()).toBe(result);
    });
  });
});
```

### 集成测试
```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 模拟依赖
```typescript
// src/cats/cats.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let controller: CatsController;
  let service: CatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [
        {
          provide: CatsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    controller = module.get<CatsController>(CatsController);
    service = module.get<CatsService>(CatsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = [];
      jest.spyOn(service, 'findAll').mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
    });
  });
});
```

## 部署

### 构建应用
```bash
npm run build
```

### 使用 PM2 部署
```bash
npm install -g pm2

# 启动应用
pm2 start dist/main.js --name "nest-app"

# 查看状态
pm2 status

# 查看日志
pm2 logs nest-app
```

### Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

### 环境配置
```typescript
// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },
});

// 在 app.module.ts 中使用
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
```

## 最佳实践

### 1. 项目结构
```
src/
├── common/           # 通用模块
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   └── pipes/
├── config/          # 配置文件
├── modules/         # 功能模块
│   ├── auth/
│   ├── users/
│   └── tasks/
├── shared/          # 共享模块
└── main.ts
```

### 2. 错误处理
```typescript
// 统一错误响应格式
export class ApiException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    errorCode?: string,
  ) {
    super(
      {
        message,
        errorCode,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}
```

### 3. 日志记录
```typescript
// 使用内置 Logger
import { Logger } from '@nestjs/common';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);

  findAll(): Cat[] {
    this.logger.log('Finding all cats');
    return this.cats;
  }
}
```

### 4. 配置管理
```typescript
// 使用 ConfigService
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getPort(): number {
    return this.configService.get<number>('PORT', 3000);
  }
}
```

### 5. 数据验证
```typescript
// 使用 class-validator
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
  password: string;
}
```

## 总结

NestJS 是一个功能强大的 Node.js 框架，它提供了：

1. **结构化的架构**: 通过模块、控制器、服务等概念组织代码
2. **强大的依赖注入**: 使代码更易测试和维护
3. **装饰器驱动**: 简化了路由定义和元数据管理
4. **TypeScript 支持**: 提供更好的类型安全和开发体验
5. **丰富的生态系统**: 支持各种数据库、认证、缓存等

相比 Express，NestJS 更适合构建大型、复杂的应用程序，虽然学习曲线较陡峭，但它提供的结构化和可维护性优势是值得的。

通过本指南，您应该能够开始使用 NestJS 构建自己的应用程序。建议从简单的 CRUD 应用开始，逐步学习更高级的特性。


