function myCall(thisArg, ...argument) {
	const fn = this
	thisArg = (thisArg === 'null' || thisArg === 'undefined') ? window : Object(thisArg)
	thisArg.fn = fn
	thisArg.fn(...argument)
	delete thisArg.fn
}

function myApply(thisArg, ...argument) {
	const fn = this
	thisArg = (thisArg === 'null' || thisArg === 'undefined') ? window : Object(thisArg)
	thisArg.fn = fn
	thisArg.fn(argument)
	delete thisArg.fn
}

function myBind(thisArg, ...argument) {
	const fn = this
	thisArg = (thisArg === 'null' || thisArg === 'undefined') ? window : Object(thisArg)
	thisArg.fn = fn
	return function proxy(...arg) {
		return thisArg.fn(...arg, ...argument)
	}
}