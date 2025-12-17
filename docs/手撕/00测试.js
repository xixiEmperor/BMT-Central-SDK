class Scheduler {
  constructor (max) {
    this.max = max
    this.queue = []
    this.running = 0
  }

  add (task) {
    return new Promise(resolve => {
      this.queue.push({task, resolve})
      this.run()
    })
  }

  run () {
    if(this.running >= this.max || this.queue.length === 0) return
    const { task, resolve } = this.queue.shift()
    this.running++
    task().then(() => {
      this.running--
      resolve()
      this.run()
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