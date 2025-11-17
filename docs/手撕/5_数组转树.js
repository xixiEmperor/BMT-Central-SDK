const flatArray = [
  { id: 1, name: '根节点', parentId: null },
  { id: 2, name: '节点1', parentId: 1 },
  { id: 3, name: '节点2', parentId: 1 },
  { id: 4, name: '节点1.1', parentId: 2 },
  { id: 5, name: '节点1.2', parentId: 2 },
  { id: 6, name: '节点2.1', parentId: 3 },
  { id: 7, name: '节点1.1.1', parentId: 4 },
  { id: 8, name: '节点3', parentId: 1 }
];

function arrToTree (arr) {
	const map = new Map()
	const res = []

	// 建立所有节点的映射
	arr.forEach(a => {
		map.set(a.id, {...a, chidren: []})
	});

	arr.forEach(a => {
		const node = map.get(a.id)

		if(a.parentId === null) {
			res.push(node)
			return
		}

		const pNode = map.get(a.parentId)
		pNode.chidren.push(node)
	})

	return res
}

console.log(arrToTree(flatArray))