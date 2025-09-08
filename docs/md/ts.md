## class type interface 区别

**面试回答要点：**
- **class**: 创建实际的类，既有类型信息又有运行时实现，可以实例化
- **interface**: 纯类型定义，只存在于编译时，用于约束对象结构
- **type**: 类型别名，可以定义任何类型，包括联合类型、交叉类型等

**详细说明：**
```typescript
// class - 有实际实现
class User {
  constructor(public name: string) {}
  getName() { return this.name; }
}

// interface - 只定义结构
interface IUser {
  name: string;
  getName(): string;
}

// type - 类型别名
type UserType = {
  name: string;
  getName(): string;
}

// 区别：
// 1. class可以实例化，interface和type不能
const user1 = new User("张三"); // ✅
// const user2 = new IUser("李四"); // ❌

// 2. interface可以声明合并，type不能
interface Animal { name: string; }
interface Animal { age: number; } // 合并成功

// 3. type支持更复杂的类型操作
type StringOrNumber = string | number;
type UserKeys = keyof User;
```

## 泛型

**面试回答要点：**
泛型是TypeScript中实现类型复用的机制，允许在定义时不指定具体类型，在使用时再确定类型，提高代码的灵活性和类型安全性。

**核心概念：**
```typescript
// 1. 基础泛型函数
function identity<T>(arg: T): T {
  return arg;
}

// 使用
const result1 = identity<string>("hello"); // string类型
const result2 = identity<number>(42);      // number类型

// 2. 泛型约束
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length); // 现在知道arg有length属性
  return arg;
}

// 3. 泛型类
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}

// 4. 泛型接口
interface GenericIdentityFn<T> {
  (arg: T): T;
}
```

**实际应用场景：**
```typescript
// API响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 使用
type UserResponse = ApiResponse<User>;
type ListResponse<T> = ApiResponse<T[]>;
```

## 如何提取一个函数类型的返回类型？了解哪些 TypeScript 的工具类型函数？

**面试回答要点：**
使用`ReturnType<T>`工具类型可以提取函数类型的返回类型。TypeScript提供了丰富的工具类型来进行类型操作。

**ReturnType使用：**
```typescript
function getUserInfo() {
  return { id: 1, name: "张三", email: "zhangsan@example.com" };
}

type UserInfo = ReturnType<typeof getUserInfo>;
// UserInfo = { id: number; name: string; email: string; }

// 复杂函数类型
type AsyncFunction = () => Promise<string>;
type AsyncResult = ReturnType<AsyncFunction>; // Promise<string>
```

**常用工具类型：**
```typescript
interface User {
  id: number;
  name: string;
  email?: string;
  password: string;
}

// 1. Partial<T> - 所有属性变为可选
type PartialUser = Partial<User>;

// 2. Required<T> - 所有属性变为必需
type RequiredUser = Required<User>;

// 3. Pick<T, K> - 选择指定属性
type UserProfile = Pick<User, 'id' | 'name' | 'email'>;

// 4. Omit<T, K> - 排除指定属性
type CreateUser = Omit<User, 'id'>;

// 5. Record<K, T> - 创建记录类型
type UserRoles = Record<'admin' | 'user' | 'guest', boolean>;

// 6. Exclude<T, U> - 从联合类型中排除
type StringOrNumber = string | number | boolean;
type OnlyStringOrNumber = Exclude<StringOrNumber, boolean>; // string | number

// 7. Extract<T, U> - 从联合类型中提取
type OnlyString = Extract<StringOrNumber, string>; // string

// 8. NonNullable<T> - 排除null和undefined
type NonNullableString = NonNullable<string | null | undefined>; // string

// 9. Parameters<T> - 提取函数参数类型
function createUser(name: string, age: number): User { /* ... */ }
type CreateUserParams = Parameters<typeof createUser>; // [string, number]
```

## 在 any 和 unknown 之间，会如何选择来为一个变量声明类型？

**面试回答要点：**
优先选择`unknown`而不是`any`。`unknown`是类型安全的顶级类型，而`any`会关闭类型检查。

**区别对比：**
```typescript
// any - 关闭类型检查，不安全
let valueAny: any = 42;
valueAny.foo.bar; // 不报错，但运行时可能出错
valueAny(); // 不报错，但运行时可能出错
valueAny[0][1]; // 不报错，但运行时可能出错

// unknown - 类型安全的顶级类型
let valueUnknown: unknown = 42;
// valueUnknown.foo.bar; // ❌ 编译错误
// valueUnknown(); // ❌ 编译错误

// 使用unknown需要类型收窄
if (typeof valueUnknown === 'string') {
  console.log(valueUnknown.toUpperCase()); // ✅ 类型收窄后安全使用
}

if (valueUnknown instanceof Date) {
  console.log(valueUnknown.getTime()); // ✅ 类型收窄后安全使用
}
```

**选择原则：**
```typescript
// 1. 处理外部数据时使用unknown
function processApiResponse(response: unknown) {
  // 需要先验证类型
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as any).data;
  }
  throw new Error('Invalid response');
}

// 2. 渐进式迁移时临时使用any
// 从JavaScript迁移到TypeScript时，可以先用any，再逐步改为具体类型

// 3. 第三方库类型缺失时的权衡
declare const libraryFunction: any; // 临时方案
// 更好的做法是为库编写类型声明
```

## type和interface有什么区别，type能不能代替interface

**面试回答要点：**
`type`和`interface`在大多数情况下可以互换使用，但各有特点。`type`更灵活，`interface`更适合面向对象编程。

**主要区别：**
```typescript
// 1. 声明合并 - interface支持，type不支持
interface User {
  name: string;
}
interface User {
  age: number;
} // 合并成功，User现在有name和age

// type User = { name: string; }
// type User = { age: number; } // ❌ 重复标识符错误

// 2. 继承语法差异
// interface使用extends
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// type使用交叉类型
type Animal2 = {
  name: string;
}
type Dog2 = Animal2 & {
  breed: string;
}

// 3. type支持更复杂的类型操作
type StringOrNumber = string | number; // 联合类型
type UserKeys = keyof User; // 键类型
type UserName = User['name']; // 索引访问类型

// interface不能直接表示联合类型
// interface StringOrNumber = string | number; // ❌

// 4. 计算属性名
type EventHandlers = {
  [K in 'click' | 'scroll' | 'mousemove']: (event: Event) => void;
}

// interface无法直接支持计算属性名
interface EventHandlers2 {
  click: (event: Event) => void;
  scroll: (event: Event) => void;
  mousemove: (event: Event) => void;
}
```

**使用建议：**
```typescript
// 推荐使用interface的场景：
// 1. 定义对象结构，特别是需要继承的情况
interface BaseConfig {
  apiUrl: string;
  timeout: number;
}

interface DevConfig extends BaseConfig {
  debug: true;
}

// 2. 声明库的公共API
interface PublicAPI {
  init(config: BaseConfig): void;
  destroy(): void;
}

// 推荐使用type的场景：
// 1. 联合类型
type Status = 'loading' | 'success' | 'error';

// 2. 复杂的类型操作
type PartialConfig = Partial<BaseConfig>;
type ConfigKeys = keyof BaseConfig;

// 3. 函数类型
type EventHandler = (event: Event) => void;

// 4. 条件类型
type NonNullable<T> = T extends null | undefined ? never : T;
```

## ts的最佳实践

**面试回答要点：**
TypeScript最佳实践包括严格的类型配置、合理的类型设计、避免any的使用等方面。

**1. 严格模式配置**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**2. 类型设计原则**
```typescript
// ✅ 优先使用更具体的类型
type UserRole = 'admin' | 'user' | 'guest'; // 而不是 string

// ✅ 使用只读类型保护数据
interface ReadonlyUser {
  readonly id: number;
  readonly createdAt: Date;
  name: string;
}

// ✅ 合理使用泛型约束
interface Repository<T extends { id: string }> {
  findById(id: string): T | null;
  save(entity: T): T;
}

// ✅ 使用品牌类型增强类型安全
type UserId = string & { readonly brand: unique symbol };
type ProductId = string & { readonly brand: unique symbol };

function getUserById(id: UserId): User { /* ... */ }
// getUserById("invalid-id"); // ❌ 类型错误
```

**3. 错误处理模式**
```typescript
// ✅ 使用Result模式处理错误
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await api.getUser(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// 使用
const result = await fetchUser("123");
if (result.success) {
  console.log(result.data.name); // 类型安全
} else {
  console.error(result.error.message);
}
```

**4. 避免常见陷阱**
```typescript
// ❌ 避免滥用any
function processData(data: any): any { return data; }

// ✅ 使用泛型或unknown
function processData<T>(data: T): T { return data; }
function processUnknownData(data: unknown): unknown { return data; }

// ❌ 避免过度嵌套的类型
type ComplexType = {
  a: {
    b: {
      c: {
        d: string;
      }
    }
  }
}

// ✅ 分层定义类型
type DeepestLevel = { d: string };
type MiddleLevel = { c: DeepestLevel };
type SecondLevel = { b: MiddleLevel };
type TopLevel = { a: SecondLevel };
```

**5. 工具类型的合理使用**
```typescript
// ✅ 基于现有类型派生新类型
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type CreateUserRequest = Omit<User, 'id' | 'createdAt'>;
type UserProfile = Pick<User, 'id' | 'name' | 'email'>;
type UpdateUserRequest = Partial<Pick<User, 'name' | 'email'>>;
```