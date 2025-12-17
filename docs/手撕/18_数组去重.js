const arr = [1, 1, 2, 2, 3, 3]

const set = new Set(arr)
const newArr = Array.from(set)

function foo (arr) {
	return arr.reduce((old, now) => {
		if(!old.includes(now)) old.push(now)
		return old
	}, [])
}

console.log(foo(arr))

console.log(newArr)