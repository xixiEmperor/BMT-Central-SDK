# JavaScript面试知识点整理

## 1. ES6新特性

### 主要新特性
1. **let和const**：块级作用域变量声明
2. **箭头函数**：简化函数语法
3. **模板字符串**：字符串插值和多行字符串
4. **解构赋值**：从数组和对象中提取值
5. **默认参数**：函数参数默认值
6. **扩展运算符**：数组和对象的展开语法
7. **Promise**：异步编程解决方案
8. **Class**：面向对象编程语法糖
9. **模块化**：import/export
10. **Symbol**：新的原始数据类型

```javascript
// let和const
let name = 'John';
const age = 25;

// 箭头函数
const add = (a, b) => a + b;

// 模板字符串
const message = `Hello, ${name}! You are ${age} years old.`;

// 解构赋值
const [first, second] = [1, 2];
const {name: userName, age: userAge} = user;

// 默认参数
function greet(name = 'World') {
    return `Hello, ${name}!`;
}

// 扩展运算符
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];

// Promise
const fetchData = () => {
    return new Promise((resolve, reject) => {
        // 异步操作
    });
};

// Class
class Person {
    constructor(name) {
        this.name = name;
    }
    
    sayHello() {
        return `Hello, I'm ${this.name}`;
    }
}
```

## 2. Promise详解

### 什么是Promise
Promise是JavaScript中处理异步操作的对象，代表一个异步操作的最终完成或失败。

### Promise的三种状态
- **pending**：初始状态，既不是成功也不是失败
- **fulfilled**：操作成功完成
- **rejected**：操作失败

### 基本用法
```javascript
// 创建Promise
const promise = new Promise((resolve, reject) => {
    // 异步操作
    if (/* 操作成功 */) {
        resolve(value);
    } else {
        reject(error);
    }
});

// 使用Promise
promise
    .then(value => {
        // 处理成功结果
    })
    .catch(error => {
        // 处理错误
    })
    .finally(() => {
        // 无论成功失败都会执行
    });
```

### Promise链式调用
```javascript
fetchUser()
    .then(user => fetchUserPosts(user.id))
    .then(posts => posts.filter(post => post.published))
    .then(publishedPosts => {
        console.log(publishedPosts);
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

### async/await
```javascript
async function fetchData() {
    try {
        const user = await fetchUser();
        const posts = await fetchUserPosts(user.id);
        return posts.filter(post => post.published);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

## 3. 防抖和节流的区别

### 防抖（Debounce）
在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。

```javascript
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// 使用场景：搜索框输入、窗口resize
const searchInput = document.getElementById('search');
const debouncedSearch = debounce(function(e) {
    console.log('搜索:', e.target.value);
}, 300);

searchInput.addEventListener('input', debouncedSearch);
```

### 节流（Throttle）
规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效。

```javascript
function throttle(func, delay) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            func.apply(this, args);
            lastTime = now;
        }
    };
}

// 使用场景：滚动事件、鼠标移动
const throttledScroll = throttle(function() {
    console.log('滚动事件触发');
}, 100);

window.addEventListener('scroll', throttledScroll);
```

### 区别总结
- **防抖**：等待停止触发后执行，适合搜索、表单验证
- **节流**：固定时间间隔执行，适合滚动、鼠标移动

## 4. JavaScript垃圾回收机制

### 垃圾回收的目的
自动释放不再使用的内存，防止内存泄漏。

### 主要算法

#### 标记清除（Mark-and-Sweep）
1. 垃圾收集器从根对象开始遍历
2. 标记所有能访问到的对象
3. 清除未标记的对象

```javascript
// 示例：对象引用
let obj1 = { name: 'Object 1' };
let obj2 = { name: 'Object 2' };
obj1.ref = obj2;
obj2.ref = obj1;

// 即使有循环引用，标记清除也能正确回收
obj1 = null;
obj2 = null; // 两个对象都会被回收
```

#### 引用计数（Reference Counting）
记录每个对象被引用的次数，当引用次数为0时回收。

```javascript
// 引用计数的问题：循环引用
function createObjects() {
    let obj1 = {};
    let obj2 = {};
    obj1.ref = obj2;
    obj2.ref = obj1;
    // 函数结束后，obj1和obj2互相引用，引用计数不为0
    // 在引用计数算法下不会被回收
}
```

### 内存泄漏的常见原因
1. **全局变量**：未声明的变量自动成为全局变量
2. **闭包**：不当使用闭包导致变量无法释放
3. **DOM引用**：删除DOM元素但仍保持引用
4. **定时器**：未清除的定时器

```javascript
// 内存泄漏示例
function createLeak() {
    const data = new Array(1000000).fill('data');
    
    return function() {
        // 闭包持有data的引用
        console.log(data.length);
    };
}

const leak = createLeak(); // data无法被回收
```

## 5. 事件循环机制

### 事件循环的概念
JavaScript是单线程的，通过事件循环机制处理异步操作。

### 执行顺序
1. **同步代码**：直接执行
2. **微任务**：Promise.then、queueMicrotask
3. **宏任务**：setTimeout、setInterval、I/O操作

### 执行流程
```javascript
console.log('1'); // 同步代码

setTimeout(() => {
    console.log('2'); // 宏任务
}, 0);

Promise.resolve().then(() => {
    console.log('3'); // 微任务
});

console.log('4'); // 同步代码

// 输出顺序：1 4 3 2
```

### 宏任务中产生微任务的处理
当宏任务执行过程中产生微任务时，会在当前宏任务执行完毕后立即执行所有微任务。

```javascript
setTimeout(() => {
    console.log('宏任务1');
    Promise.resolve().then(() => {
        console.log('微任务1');
    });
}, 0);

setTimeout(() => {
    console.log('宏任务2');
}, 0);

Promise.resolve().then(() => {
    console.log('微任务2');
});

// 输出顺序：微任务2 宏任务1 微任务1 宏任务2
```

## 6. JavaScript性能相比C/C++较慢的原因

### 主要原因
1. **解释执行**：JavaScript是解释型语言，需要实时解析和执行
2. **动态类型**：运行时类型检查和转换
3. **垃圾回收**：自动内存管理带来的开销
4. **抽象层次高**：更多的抽象层次带来性能损失

### 性能优化
- **JIT编译**：V8引擎的即时编译优化
- **内联缓存**：缓存对象属性访问
- **隐藏类**：优化对象属性访问

```javascript
// 性能优化示例
// 避免频繁的类型转换
let sum = 0;
for (let i = 0; i < 1000000; i++) {
    sum += i; // 保持数字类型
}

// 避免在循环中创建函数
const arr = [1, 2, 3, 4, 5];
// 不好的做法
arr.forEach(function(item) {
    console.log(item);
});

// 好的做法
function logItem(item) {
    console.log(item);
}
arr.forEach(logItem);
```

## 7. JavaScript的单线程特性

### 为什么是单线程
1. **简化编程模型**：避免多线程的复杂性
2. **避免DOM操作冲突**：防止多个线程同时操作DOM
3. **历史原因**：最初设计为简单的脚本语言

### 单线程的优缺点
**优点：**
- 避免线程同步问题
- 简化编程模型
- 避免死锁

**缺点：**
- 长时间运行的任务会阻塞界面
- 无法充分利用多核CPU

### 解决方案
```javascript
// Web Workers：在后台线程运行JavaScript
// main.js
const worker = new Worker('worker.js');
worker.postMessage({data: 'Hello Worker'});
worker.onmessage = function(e) {
    console.log('收到消息:', e.data);
};

// worker.js
self.onmessage = function(e) {
    // 在后台线程中处理数据
    const result = heavyComputation(e.data);
    self.postMessage(result);
};
```

## 8. JavaScript渲染时的线程阻塞

### 阻塞原因
1. **长时间运行的JavaScript代码**
2. **同步的网络请求**
3. **复杂的DOM操作**
4. **大量的计算任务**

### 线程阻塞的表现
- 页面无响应
- 动画卡顿
- 用户交互延迟

### 解决方案
```javascript
// 1. 使用setTimeout分割任务
function heavyTask(data) {
    const chunk = data.splice(0, 100);
    // 处理chunk
    
    if (data.length > 0) {
        setTimeout(() => heavyTask(data), 0);
    }
}

// 2. 使用requestAnimationFrame
function smoothAnimation() {
    // 动画逻辑
    requestAnimationFrame(smoothAnimation);
}

// 3. 使用Web Workers
const worker = new Worker('heavy-task.js');
worker.postMessage(largeData);
```

## 9. 闭包的应用

### 什么是闭包
闭包是函数和其词法环境的组合，函数可以访问其外部作用域的变量。

### 闭包的应用场景

#### 1. 数据封装和私有变量
```javascript
function createCounter() {
    let count = 0;
    
    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count
    };
}

const counter = createCounter();
console.log(counter.getCount()); // 0
counter.increment();
console.log(counter.getCount()); // 1
// count变量无法直接访问，实现了封装
```

#### 2. 函数工厂
```javascript
function createMultiplier(multiplier) {
    return function(x) {
        return x * multiplier;
    };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

#### 3. 模块模式
```javascript
const myModule = (function() {
    let privateVar = 0;
    
    function privateFunction() {
        console.log('私有函数');
    }
    
    return {
        publicMethod: function() {
            privateVar++;
            privateFunction();
        },
        getPrivateVar: function() {
            return privateVar;
        }
    };
})();
```

#### 4. 事件处理和回调
```javascript
function attachListeners() {
    const name = 'Button';
    
    document.getElementById('btn').addEventListener('click', function() {
        console.log(`${name} clicked`);
    });
}
```

## 10. call和apply的性能比较

### 基本用法
```javascript
function greet(greeting, punctuation) {
    return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: 'John' };

// call：参数逐个传递
greet.call(person, 'Hello', '!');

// apply：参数以数组形式传递
greet.apply(person, ['Hello', '!']);

// bind：返回新函数
const boundGreet = greet.bind(person);
boundGreet('Hello', '!');
```

### 性能比较
- **call通常比apply快**：因为参数直接传递，不需要数组解构
- **现代JavaScript引擎优化**：性能差异在大多数情况下可以忽略

```javascript
// 性能测试示例
function testPerformance() {
    const obj = { value: 42 };
    
    function testFunc(a, b, c) {
        return this.value + a + b + c;
    }
    
    console.time('call');
    for (let i = 0; i < 1000000; i++) {
        testFunc.call(obj, 1, 2, 3);
    }
    console.timeEnd('call');
    
    console.time('apply');
    for (let i = 0; i < 1000000; i++) {
        testFunc.apply(obj, [1, 2, 3]);
    }
    console.timeEnd('apply');
}
```

## 11. JavaScript为什么需要异步

### 异步的必要性
1. **非阻塞I/O**：网络请求、文件读取不阻塞主线程
2. **用户体验**：保持界面响应
3. **资源利用**：在等待期间可以处理其他任务

### 异步的实现方式
```javascript
// 1. 回调函数
function fetchData(callback) {
    setTimeout(() => {
        callback('数据');
    }, 1000);
}

// 2. Promise
function fetchDataPromise() {
    return new Promise(resolve => {
        setTimeout(() => resolve('数据'), 1000);
    });
}

// 3. async/await
async function fetchDataAsync() {
    const data = await fetchDataPromise();
    return data;
}
```

### 异步编程的优势
- 提高程序并发性
- 改善用户体验
- 更好的资源利用率

## 12. 浅拷贝和深拷贝的区别

### 浅拷贝
只复制对象的第一层属性，对于嵌套对象仍然是引用。

```javascript
// 浅拷贝方法
const obj = { a: 1, b: { c: 2 } };

// 1. Object.assign
const shallow1 = Object.assign({}, obj);

// 2. 扩展运算符
const shallow2 = { ...obj };

// 3. Array.from（数组）
const arr = [1, [2, 3]];
const shallowArr = Array.from(arr);

// 浅拷贝的问题
shallow1.b.c = 999;
console.log(obj.b.c); // 999，原对象被修改
```

### 深拷贝
递归复制对象的所有层级，完全独立的副本。

```javascript
// 深拷贝方法
const obj = { a: 1, b: { c: 2 }, d: [3, 4] };

// 1. JSON方法（有限制）
const deep1 = JSON.parse(JSON.stringify(obj));

// 2. 递归实现
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clonedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// 3. 使用第三方库
// const deep3 = _.cloneDeep(obj); // lodash
```

### 使用场景
- **浅拷贝**：对象结构简单，性能要求高
- **深拷贝**：对象结构复杂，需要完全独立的副本

## 13. 箭头函数和普通函数的区别

### 主要区别

#### 1. this绑定
```javascript
// 普通函数：this动态绑定
function normalFunction() {
    console.log(this);
}

// 箭头函数：this继承自外层作用域
const arrowFunction = () => {
    console.log(this);
};

const obj = {
    name: 'Object',
    normal: function() {
        console.log(this.name); // 'Object'
    },
    arrow: () => {
        console.log(this.name); // undefined（继承全局作用域）
    }
};
```

#### 2. arguments对象
```javascript
// 普通函数有arguments对象
function normalFunc() {
    console.log(arguments); // [1, 2, 3]
}

// 箭头函数没有arguments对象
const arrowFunc = () => {
    console.log(arguments); // ReferenceError
};

// 箭头函数使用rest参数
const arrowWithRest = (...args) => {
    console.log(args); // [1, 2, 3]
};
```

#### 3. 构造函数
```javascript
// 普通函数可以作为构造函数
function Person(name) {
    this.name = name;
}
const person = new Person('John'); // 正常

// 箭头函数不能作为构造函数
const PersonArrow = (name) => {
    this.name = name;
};
const person2 = new PersonArrow('Jane'); // TypeError
```

#### 4. 原型
```javascript
// 普通函数有prototype属性
function normalFunc() {}
console.log(normalFunc.prototype); // {}

// 箭头函数没有prototype属性
const arrowFunc = () => {};
console.log(arrowFunc.prototype); // undefined
```

### 使用场景
- **箭头函数**：回调函数、数组方法、需要继承外层this
- **普通函数**：对象方法、构造函数、需要动态this

## 14. let、const、var的区别

### 作用域
```javascript
// var：函数作用域
function testVar() {
    if (true) {
        var x = 1;
    }
    console.log(x); // 1，可以访问
}

// let/const：块级作用域
function testLet() {
    if (true) {
        let y = 1;
        const z = 2;
    }
    console.log(y); // ReferenceError
    console.log(z); // ReferenceError
}
```

### 变量提升
```javascript
// var：变量提升，初始化为undefined
console.log(a); // undefined
var a = 1;

// let/const：变量提升，但存在暂时性死区
console.log(b); // ReferenceError
let b = 2;

console.log(c); // ReferenceError
const c = 3;
```

### 重复声明
```javascript
// var：允许重复声明
var name = 'John';
var name = 'Jane'; // 正常

// let/const：不允许重复声明
let age = 25;
let age = 30; // SyntaxError

const score = 100;
const score = 200; // SyntaxError
```

### 重新赋值
```javascript
// var和let：可以重新赋值
var x = 1;
x = 2; // 正常

let y = 1;
y = 2; // 正常

// const：不能重新赋值
const z = 1;
z = 2; // TypeError

// 但对象和数组的内容可以修改
const obj = { name: 'John' };
obj.name = 'Jane'; // 正常
obj.age = 25; // 正常
```

### 使用建议
- **const**：优先使用，用于不会重新赋值的变量
- **let**：需要重新赋值的变量
- **var**：尽量避免使用

## 15. ==和===的区别

### 相等运算符（==）
进行类型转换后比较值。

```javascript
// 类型转换示例
console.log(1 == '1');     // true
console.log(true == 1);    // true
console.log(null == undefined); // true
console.log(0 == false);   // true
console.log('' == false);  // true
```

### 严格相等运算符（===）
不进行类型转换，类型和值都必须相同。

```javascript
// 严格比较示例
console.log(1 === '1');    // false
console.log(true === 1);   // false
console.log(null === undefined); // false
console.log(0 === false);  // false
console.log('' === false); // false
```

### 类型转换规则
```javascript
// ==的转换规则
// 1. 如果类型相同，比较值
// 2. null和undefined相等
// 3. 数字和字符串比较，字符串转数字
// 4. 布尔值转数字再比较
// 5. 对象转原始值再比较

// 复杂示例
console.log([] == false);  // true
// [] -> '' -> 0, false -> 0, 0 == 0

console.log([] == ![]);    // true
// ![] -> false, [] == false -> true
```

### 使用建议
- **推荐使用===**：避免意外的类型转换
- **特殊情况使用==**：检查null/undefined

## 16. forEach和map的区别

### 基本用法
```javascript
const arr = [1, 2, 3, 4, 5];

// forEach：遍历数组，无返回值
arr.forEach((item, index) => {
    console.log(item, index);
});

// map：遍历数组，返回新数组
const doubled = arr.map(item => item * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```

### 主要区别
1. **返回值**：forEach返回undefined，map返回新数组
2. **用途**：forEach用于副作用，map用于数据转换
3. **链式调用**：map可以链式调用，forEach不行

```javascript
// map的链式调用
const result = arr
    .map(x => x * 2)
    .filter(x => x > 4)
    .map(x => x + 1);

// forEach无法链式调用
arr.forEach(x => x * 2).filter(x => x > 4); // TypeError
```

### 性能比较
- **forEach**：略快，因为不需要创建新数组
- **map**：需要创建新数组，内存开销更大

## 17. forEach修改数据的区别

### 修改基本数据类型
```javascript
const numbers = [1, 2, 3, 4, 5];

// 无法修改基本数据类型的值
numbers.forEach((item, index, arr) => {
    item = item * 2; // 不会修改原数组
});
console.log(numbers); // [1, 2, 3, 4, 5]

// 正确的修改方式
numbers.forEach((item, index, arr) => {
    arr[index] = item * 2;
});
console.log(numbers); // [2, 4, 6, 8, 10]
```

### 修改引用数据类型
```javascript
const objects = [
    { name: 'John', age: 25 },
    { name: 'Jane', age: 30 }
];

// 可以修改对象的属性
objects.forEach(obj => {
    obj.age += 1; // 修改原对象
});
console.log(objects); // age都增加了1

// 不能替换整个对象
objects.forEach(obj => {
    obj = { name: 'New', age: 0 }; // 不会修改原数组
});
console.log(objects); // 对象没有被替换
```

### 原因分析
- **基本类型**：按值传递，修改参数不影响原值
- **引用类型**：按引用传递，可以修改对象内容，但不能替换对象引用

## 18. 基本数据类型和引用数据类型

### 基本数据类型
存储在栈内存中，按值传递。

```javascript
// 基本数据类型
let a = 1;
let b = a;
b = 2;
console.log(a); // 1，a不受影响

// 7种基本类型
let num = 42;           // number
let str = 'hello';      // string
let bool = true;        // boolean
let undef = undefined;  // undefined
let nul = null;         // null
let sym = Symbol('id'); // symbol
let big = 123n;         // bigint
```

### 引用数据类型
存储在堆内存中，按引用传递。

```javascript
// 引用数据类型
let obj1 = { name: 'John' };
let obj2 = obj1;
obj2.name = 'Jane';
console.log(obj1.name); // 'Jane'，obj1受影响

// 常见的引用类型
let object = {};
let array = [];
let func = function() {};
let date = new Date();
let regex = /pattern/;
```

### 内存分配
```javascript
// 栈内存：基本类型
let x = 10;
let y = x; // 复制值

// 堆内存：引用类型
let obj1 = { value: 10 };
let obj2 = obj1; // 复制引用

// 比较行为
console.log(10 === 10);        // true，值相等
console.log({} === {});        // false，不同对象
console.log(obj1 === obj2);    // true，同一引用
```

### 类型检测
```javascript
// typeof操作符
console.log(typeof 42);        // 'number'
console.log(typeof 'hello');   // 'string'
console.log(typeof true);      // 'boolean'
console.log(typeof undefined); // 'undefined'
console.log(typeof null);      // 'object'（历史遗留问题）
console.log(typeof {});        // 'object'
console.log(typeof []);        // 'object'
console.log(typeof function(){}); // 'function'

// 更准确的类型检测
console.log(Object.prototype.toString.call([]));        // '[object Array]'
console.log(Object.prototype.toString.call({}));        // '[object Object]'
console.log(Object.prototype.toString.call(null));      // '[object Null]'
```

## 19. Promise.all和Promise.race的区别

### Promise.all
等待所有Promise完成，如果有一个失败则立即失败。

```javascript
const promise1 = Promise.resolve(1);
const promise2 = new Promise(resolve => setTimeout(() => resolve(2), 1000));
const promise3 = Promise.resolve(3);

Promise.all([promise1, promise2, promise3])
    .then(values => {
        console.log(values); // [1, 2, 3]
    })
    .catch(error => {
        console.error(error);
    });

// 如果有一个失败
const failPromise = Promise.reject('Error');
Promise.all([promise1, failPromise, promise3])
    .then(values => {
        // 不会执行
    })
    .catch(error => {
        console.error(error); // 'Error'
    });
```

### Promise.race
返回第一个完成的Promise的结果。

```javascript
const slow = new Promise(resolve => setTimeout(() => resolve('slow'), 2000));
const fast = new Promise(resolve => setTimeout(() => resolve('fast'), 1000));

Promise.race([slow, fast])
    .then(value => {
        console.log(value); // 'fast'
    });

// 第一个失败也会立即返回
const error = new Promise((resolve, reject) => 
    setTimeout(() => reject('Error'), 500)
);

Promise.race([slow, fast, error])
    .then(value => {
        // 不会执行
    })
    .catch(error => {
        console.error(error); // 'Error'
    });
```

### 使用场景
- **Promise.all**：并行执行多个独立任务，需要所有结果
- **Promise.race**：超时控制、获取最快响应

```javascript
// 超时控制示例
function withTimeout(promise, timeout) {
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
    });
    
    return Promise.race([promise, timeoutPromise]);
}

// 使用
withTimeout(fetch('/api/data'), 5000)
    .then(response => response.json())
    .catch(error => console.error(error));
```

### 其他Promise方法
```javascript
// Promise.allSettled：等待所有Promise完成，不管成功失败
Promise.allSettled([promise1, promise2, promise3])
    .then(results => {
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                console.log('成功:', result.value);
            } else {
                console.log('失败:', result.reason);
            }
        });
    });

// Promise.any：第一个成功的Promise
Promise.any([promise1, promise2, promise3])
    .then(value => {
        console.log('第一个成功:', value);
    })
    .catch(error => {
        console.log('全部失败:', error);
    });
```
## 宏任务和微任务有哪些