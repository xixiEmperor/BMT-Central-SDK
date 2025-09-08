class EventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    const set = this.events.get(event)

    set.add(callback)
  }

  off(event, callback) {
    const set = this.events.get(event)
    if (!set) return

    if (callback) {
      set.delete(callback)
      // 如果set为空，删除整个事件
      if (set.size === 0) {
        this.events.delete(event)
      }
    } else {
      // 如果没有指定callback，清除整个事件的所有订阅者
      set.clear()
      this.events.delete(event)
    }
  }

  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args)
      this.off(event, onceCallback)
    }
    this.on(event, onceCallback)
  }

  emit(event, ...args) {
    const set = this.events.get(event)
    if (!set) return

    for (const callback of set) {
      try {
        callback(...args)
      } catch (error) {
        console.error(`Error in event ${event} callback:`, error)
      }
    }
  }
}