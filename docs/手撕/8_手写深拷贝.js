// 修复后的深拷贝函数
function deepClone(obj, map = new WeakMap()) {
    if (typeof obj !== 'object' || obj === null) return obj

    if (map.get(obj)) {
        return map.get(obj)
    }

    const newObj = Array.isArray(obj) ? [] : {}

    map.set(obj, newObj)

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            newObj[key] = deepClone(obj[key], map) // 修复：应该是obj[key]
        }
    }

    return newObj
}

// 没有hasOwnProperty的版本
function deepCloneWithoutHasOwnProp(obj, map = new WeakMap()) {
    if (typeof obj !== 'object' || obj === null) return obj

    if (map.get(obj)) {
        return map.get(obj)
    }

    const newObj = Array.isArray(obj) ? [] : {}

    map.set(obj, newObj)

    for (const key in obj) {
        // 没有hasOwnProperty检查！
        newObj[key] = deepCloneWithoutHasOwnProp(obj[key], map)
    }

    return newObj
}

// 演示原型链问题
console.log("=== 演示hasOwnProperty的重要性 ===")

// 创建一个原型对象
function Person(name) {
    this.name = name
    this.age = 25
}

Person.prototype.species = 'human'
Person.prototype.sayHello = function() {
    return `Hello, I'm ${this.name}`
}

const john = new Person('John')
john.hobby = 'reading'

console.log("原始对象john:")
console.log("john.name:", john.name)
console.log("john.age:", john.age)
console.log("john.hobby:", john.hobby)
console.log("john.species:", john.species) // 来自原型链
console.log("john.sayHello:", typeof john.sayHello) // 来自原型链

console.log("\n使用hasOwnProperty的深拷贝:")
const cloned1 = deepClone(john)
console.log("cloned1:", cloned1)
console.log("cloned1.species:", cloned1.species) // undefined，因为被过滤了

console.log("\n不使用hasOwnProperty的深拷贝:")
const cloned2 = deepCloneWithoutHasOwnProp(john)
console.log("cloned2:", cloned2)
console.log("cloned2.species:", cloned2.species) // 'human'，原型链属性被复制了

// 检查原型链
console.log("\n原型链检查:")
console.log("john.hasOwnProperty('name'):", john.hasOwnProperty('name')) // true
console.log("john.hasOwnProperty('species'):", john.hasOwnProperty('species')) // false
console.log("john.hasOwnProperty('sayHello'):", john.hasOwnProperty('sayHello')) // false