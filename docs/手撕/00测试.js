class EventEmitter {
    constructor() {
        this.subscriber = new Map()
        this.count = 0
    }

    on(topic, callback) {
        let listeners = this.subscriber.get(topic)

        if (!listeners) {
            this.subscriber.set(topic, new Set())
        }
        listeners = this.subscriber.get(topic)

        let id = this.count
        console.log(`您的订阅id为${id}`)
        const item = new Map()
        item.set(id, callback)
        listeners.add(item)
        this.count++
    }

    emit(topic, data) {
        let index = 0

        let listeners = this.subscriber.get(topic)
        if (!listeners) {
            console.log('您发送的频道不存在')
            return
        }

        listeners.forEach((l) => {
            const c = l.get(index)
            c(data)
            index++
        });
    }

    look() {
        console.log(this.subscriber)
    }

    off(topic, id) {
        const listeners = this.subscriber.get(topic)

        if (!listeners) {
            console.log('您取消订阅的主题不存在')
            return
        }

        // 找到包含指定id的Map对象并删除它
        listeners.forEach((l) => {
            if (l.has(id)) {
                listeners.delete(l)  // 删除整个Map对象，而不是id
                if (listeners.size === 0) {
                    this.subscriber.delete(topic)
                }
            }
        })
    }
}

const emiter = new EventEmitter()

emiter.on('test1', (data) => {
    console.log("test1接收到数据:", data)
})


emiter.emit('test1', "1")

emiter.off('test1', 0)
emiter.look()

emiter.emit('test1', '1')

