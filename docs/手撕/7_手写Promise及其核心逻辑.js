// ==================== 简易Promise实现 ====================
// Promise代表一个异步操作的最终完成或失败及其结果值
//
// 注意：这个实现为了教学目的使用setTimeout模拟异步执行
// 在浏览器环境中，真正的Promise使用微任务队列（MutationObserver或queueMicrotask）
// 下面是更准确的微任务实现方式：
//
// // 微任务调度函数（浏览器环境）
// const runMicroTask = (callback) => {
//   if (typeof queueMicrotask === 'function') {
//     queueMicrotask(callback);  // 现代浏览器原生支持
//   } else if (typeof MutationObserver === 'function') {
//     const observer = new MutationObserver(callback);
//     const node = document.createTextNode('');
//     observer.observe(node, { characterData: true });
//     node.data = '1';
//   } else {
//     setTimeout(callback, 0);  // 降级到宏任务
//   }
// };

class MyPromise {
  /**
   * 构造函数 - 创建一个Promise实例
   * @param {Function} executor 执行器函数，接收resolve和reject两个参数
   */
  constructor(executor) {
    // Promise的三种状态：pending(等待中)、fulfilled(已完成)、rejected(已拒绝)
    this.status = 'pending'; // pending, fulfilled, rejected
    // 成功时的值
    this.value = undefined;
    // 失败时的原因
    this.reason = undefined;
    // 存储成功状态下的回调函数队列
    this.onFulfilledCallbacks = [];
    // 存储失败状态下的回调函数队列
    this.onRejectedCallbacks = [];

    /**
     * resolve函数 - 将Promise状态变为fulfilled
     * @param {*} value 成功的值
     */
    const resolve = (value) => {
      // 只有在pending状态下才能改变状态（状态一旦改变就不可逆）
      if (this.status === 'pending') {
        this.status = 'fulfilled';  // 改变状态为已完成
        this.value = value;         // 保存成功值
        // 执行所有已注册的成功回调函数
        this.onFulfilledCallbacks.forEach(callback => callback());
      }
    };

    /**
     * reject函数 - 将Promise状态变为rejected
     * @param {*} reason 失败的原因
     */
    const reject = (reason) => {
      // 只有在pending状态下才能改变状态
      if (this.status === 'pending') {
        this.status = 'rejected';   // 改变状态为已拒绝
        this.reason = reason;       // 保存失败原因
        // 执行所有已注册的失败回调函数
        this.onRejectedCallbacks.forEach(callback => callback());
      }
    };

    // 立即执行执行器函数，并传入resolve和reject方法
    try {
      executor(resolve, reject);
    } catch (error) {
      // 如果执行器函数抛出异常，直接reject
      reject(error);
    }
  }

  /**
   * then方法 - 注册成功和失败的回调函数，并返回一个新的Promise
   * @param {Function} onFulfilled 成功时的回调函数
   * @param {Function} onRejected 失败时的回调函数
   * @returns {MyPromise} 返回一个新的Promise实例，支持链式调用
   */
  then(onFulfilled, onRejected) {
    // 如果没有传入回调函数，则创建一个默认的传递函数（值穿透）
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    // 默认的reject处理：继续抛出错误，实现错误穿透
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };

    // then方法必须返回一个新的Promise实例（Promise链式调用的关键）
    const promise2 = new MyPromise((resolve, reject) => {
      // 当前Promise已经成功的情况
      if (this.status === 'fulfilled') {
        // 使用setTimeout模拟微任务（实际是宏任务，但保证异步执行）
        // 注意：在浏览器环境中，真正的Promise使用微任务队列
        // 这里为了兼容性和简单性，使用setTimeout模拟异步执行
        setTimeout(() => {
          try {
            // 执行成功回调函数，获取返回值x
            const x = onFulfilled(this.value);
            // 根据x的值来决定promise2的状态（核心递归逻辑）
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            // 如果回调函数执行出错，直接reject promise2
            reject(error);
          }
        }, 0);
      }

      // 当前Promise已经失败的情况
      if (this.status === 'rejected') {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }

      // 当前Promise还在pending状态的情况（异步场景）
      if (this.status === 'pending') {
        // 将成功回调函数存储到队列中，等待resolve调用
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });

        // 将失败回调函数存储到队列中，等待reject调用
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });

    // 返回新的Promise实例，实现链式调用
    return promise2;
  }

  /**
   * catch方法 - 只处理错误情况的语法糖
   * @param {Function} onRejected 失败时的回调函数
   * @returns {MyPromise} 返回一个新的Promise实例
   */
  catch(onRejected) {
    // catch实际上就是then(null, onRejected)的语法糖
    return this.then(null, onRejected);
  }

  // ==================== 静态方法 ====================

  /**
   * Promise.resolve - 将传入的值包装成一个已解决的Promise
   * @param {*} value 要包装的值（可以是普通值或其他Promise）
   * @returns {MyPromise} 返回一个已解决的Promise实例
   */
  static resolve(value) {
    // 如果传入的已经是Promise实例，直接返回（避免重复包装）
    if (value instanceof MyPromise) {
      return value;
    }
    // 否则创建一个新的已解决的Promise
    return new MyPromise((resolve) => {
      resolve(value);
    });
  }

  /**
   * Promise.reject - 创建一个已拒绝的Promise
   * @param {*} reason 拒绝的原因
   * @returns {MyPromise} 返回一个已拒绝的Promise实例
   */
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  /**
   * Promise.all - 等待所有Promise都完成（或任意一个失败）
   * @param {Array} promises Promise数组
   * @returns {MyPromise} 返回一个新的Promise，按顺序保存所有结果
   */
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];          // 存储每个Promise的结果
      let completedCount = 0;      // 已完成的Promise数量
      const total = promises.length; // 总Promise数量

      // 如果传入空数组，直接resolve空数组
      if (total === 0) {
        resolve(results);
        return;
      }

      promises.forEach((promise, index) => {
        // 将每个promise都包装成MyPromise（处理非Promise值）
        MyPromise.resolve(promise).then((value) => {
          results[index] = value;    // 按索引保存结果，保持顺序
          completedCount++;
          // 当所有Promise都完成时，resolve最终结果
          if (completedCount === total) {
            resolve(results);
          }
        }).catch(reject); // 任意一个失败，整个all失败
      });
    });
  }

  /**
   * Promise.race - 返回第一个完成（解决或拒绝）的Promise的结果
   * @param {Array} promises Promise数组
   * @returns {MyPromise} 返回第一个完成的Promise的结果
   */
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach((promise) => {
        // 将每个promise都包装成MyPromise
        MyPromise.resolve(promise).then(resolve).catch(reject);
        // 第一个resolve或reject的promise会决定最终结果
      });
    });
  }

  /**
   * Promise.allSettled - 等待所有Promise都完成（解决或拒绝）
   * @param {Array} promises Promise数组
   * @returns {MyPromise} 返回一个新的Promise，包含所有Promise的最终状态
   *
   * 特点：
   * - 不会因为某个Promise失败而中断
   * - 等待所有Promise完成后返回结果数组
   * - 每个结果包含status('fulfilled'/'rejected')和相应的value或reason
   */
  static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];          // 存储每个Promise的最终结果
      let completedCount = 0;      // 已完成的Promise数量
      const total = promises.length; // 总Promise数量

      // 如果传入空数组，直接resolve空数组
      if (total === 0) {
        resolve(results);
        return;
      }

      promises.forEach((promise, index) => {
        // 将每个promise都包装成MyPromise（处理非Promise值）
        MyPromise.resolve(promise).then(
          // 成功处理：记录fulfilled状态和值
          (value) => {
            results[index] = {
              status: 'fulfilled',
              value: value
            };
            completedCount++;
            // 当所有Promise都完成时，resolve最终结果
            if (completedCount === total) {
              resolve(results);
            }
          },
          // 失败处理：记录rejected状态和原因
          (reason) => {
            results[index] = {
              status: 'rejected',
              reason: reason
            };
            completedCount++;
            // 当所有Promise都完成时，resolve最终结果
            if (completedCount === total) {
              resolve(results);
            }
          }
        );
      });
    });
  }
}

// ==================== Promise解决过程 ====================
/**
 * Promise解决过程函数 - 处理then方法的返回值，实现Promise的递归解析
 * 这是一个非常重要的函数，实现了Promise/A+规范的核心逻辑
 *
 * @param {MyPromise} promise2 新创建的Promise实例
 * @param {*} x then方法回调函数的返回值
 * @param {Function} resolve promise2的resolve函数
 * @param {Function} reject promise2的reject函数
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 防止循环引用：如果then方法返回的是promise2本身，会导致无限递归
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise'));
  }

  // 标记是否已经调用过resolve或reject，防止重复调用
  let called = false;

  // 判断x是否是一个thenable对象（具有then方法的对象或函数）
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      // 获取x的then方法
      const then = x.then;

      // 如果x有then方法且是函数，则认为x是一个Promise-like对象
      if (typeof then === 'function') {
        // 调用x的then方法，实现Promise的递归解析
        then.call(x,
          // 成功回调：继续递归解析返回值y
          (y) => {
            if (called) return; // 防止重复调用
            called = true;
            resolvePromise(promise2, y, resolve, reject); // 递归处理
          },
          // 失败回调：直接reject
          (r) => {
            if (called) return; // 防止重复调用
            called = true;
            reject(r);
          }
        );
      } else {
        // x不是thenable对象，直接resolve
        resolve(x);
      }
    } catch (error) {
      // 如果获取then方法或调用then方法时出错
      if (called) return; // 防止重复调用
      called = true;
      reject(error);
    }
  } else {
    // x是普通值（非对象或函数），直接resolve
    resolve(x);
  }
}

// ==================== 重要说明 ====================
//
// 🎯 关于setTimeout vs 微任务的区别：
//
// 1. 真正的Promise在浏览器中使用微任务队列
//    - 使用queueMicrotask()或MutationObserver
//    - then回调在当前宏任务结束后立即执行
//
// 2. 本实现使用setTimeout模拟异步行为
//    - setTimeout是宏任务，会在下一个事件循环执行
//    - 这与真正的Promise行为略有不同，但核心逻辑相同
//
// 3. 在Node.js环境中，真正的Promise使用process.nextTick
//    - 这也是微任务的一种实现方式
//
// 📚 推荐学习资料：
// - Promise/A+规范：https://promisesaplus.com/
// - 事件循环详解：https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/
// - 微任务vs宏任务：https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

// ==================== 测试代码 ====================
// 运行测试用例，验证Promise实现的正确性
console.log('=== Promise 测试（使用setTimeout模拟异步）===');

// 1. 基本用法测试 - 异步resolve
console.log('1. 基本异步Promise测试');
const promise1 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('Hello World!');
  }, 1000);
});

promise1.then((value) => {
  console.log('Promise resolved:', value);
});

// 2. Promise.resolve 测试 - 直接包装值
console.log('2. Promise.resolve静态方法测试');
const promise2 = MyPromise.resolve('Direct resolve');
promise2.then((value) => {
  console.log('Promise.resolve:', value);
});

// 3. Promise.reject 测试 - 直接创建拒绝状态
console.log('3. Promise.reject静态方法测试');
const promise3 = MyPromise.reject('Error occurred');
promise3.catch((reason) => {
  console.log('Promise.reject:', reason);
});

// 4. 链式调用测试 - then方法的返回值穿透
console.log('4. Promise链式调用测试（值穿透）');
const promise4 = new MyPromise((resolve) => {
  resolve(1);
}).then((value) => {
  console.log('First then:', value);
  return value * 2;  // 返回新值，会传递给下一个then
}).then((value) => {
  console.log('Second then:', value);
  return value * 3;  // 继续传递
}).then((value) => {
  console.log('Third then:', value);
});

// 5. Promise.all 测试 - 等待所有Promise完成
console.log('5. Promise.all并发控制测试');
const promise5 = MyPromise.all([
  MyPromise.resolve(1),  // 同步resolve
  MyPromise.resolve(2),  // 同步resolve
  new MyPromise((resolve) => setTimeout(() => resolve(3), 500)) // 异步resolve
]).then((values) => {
  console.log('Promise.all:', values); // 输出: [1, 2, 3]
});

// 6. Promise.race 测试 - 竞态：返回最先完成的Promise
console.log('6. Promise.race竞态测试');
const promise6 = MyPromise.race([
  new MyPromise((resolve) => setTimeout(() => resolve('fast'), 100)),   // 100ms后完成
  new MyPromise((resolve) => setTimeout(() => resolve('slow'), 1000))   // 1000ms后完成
]).then((value) => {
  console.log('Promise.race:', value); // 输出: 'fast'（最先完成的）
});

// 7. Promise.allSettled 测试 - 无论成功失败都等待所有完成
console.log('7. Promise.allSettled测试 - 混合成功和失败');
const promise7 = MyPromise.allSettled([
  MyPromise.resolve('success1'),        // 成功
  MyPromise.reject('error1'),           // 失败
  new MyPromise((resolve) => setTimeout(() => resolve('success2'), 100)),  // 异步成功
  new MyPromise((resolve, reject) => setTimeout(() => reject('error2'), 50))  // 异步失败
]).then((results) => {
  console.log('Promise.allSettled results:');
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`  [${index}] fulfilled:`, result.value);
    } else {
      console.log(`  [${index}] rejected:`, result.reason);
    }
  });
});

// 8. 错误处理测试 - 异步reject和错误捕获
console.log('8. 错误处理和catch方法测试');
const promise8 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error('Something went wrong'));
  }, 200);
});

promise8.catch((error) => {
  console.log('Error caught:', error.message);
});
