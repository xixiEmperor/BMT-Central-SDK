// Scheduler，限制并发执行的任务队列
class Scheduler {
  constructor(max = 2) {
    this.max = max;        // 最大并发数
    this.running = 0;      // 当前运行中的任务数
    this.queue = [];       // 等待队列
  }

  // 接收一个返回 Promise 的函数 taskFn
  add(taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this._runNext();
    });
  }

  _runNext() {
    if (this.running >= this.max || this.queue.length === 0) return;
    const { taskFn, resolve, reject } = this.queue.shift();
    this.running++;
    taskFn().then(() => {
			this.running--
			resolve()
			this._runNext()
		})
  }
}

// 示例：应输出 '2', '3', '1', '4'
const scheduler = new Scheduler(2);
// 这里注意timer返回的是一个返回Promise的函数，用到了闭包
const timer = (delay) => () => new Promise((res) => setTimeout(res, delay));

scheduler.add(timer(1000)).then(() => console.log('1'));
scheduler.add(timer(300)).then(() => console.log('2'));
scheduler.add(timer(500)).then(() => console.log('3'));
scheduler.add(timer(800)).then(() => console.log('4'));