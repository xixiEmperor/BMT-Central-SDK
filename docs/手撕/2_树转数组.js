const tree = [
  {
    id: 1,
    name: 'Root',
    children: [
      {
        id: 2,
        name: 'Child 1',
        children: [{ id: 4, name: 'Grandchild 1', children: [] }],
      },
      {
        id: 3,
        name: 'Child 2',
        children: [],
      },
    ],
  },
]

const treeToArr = (tree, parentId = null) => {
	const res = []

	for(const node of tree) {
		const { id, name, children } = node
		res.push({id, name, parentId})
		if(children && children.length !== 0) {
			res.push(...treeToArr(children, id))
		}
	}

	return res
}