function myNew(constructor, ...arg) {
    const obj = {}
    obj.__proto__ = constructor.prototype
    res = constructor.apply(obj, ...arg)
    return obj instanceof Object ? res : obj
}