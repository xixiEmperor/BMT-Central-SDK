import fs from "fs"
import path from "path"

// 当前文件所在文件夹路径
const __dirname = import.meta.dirname

// 定义包路径数组
const packages = [
	path.resolve(__dirname, '../packages/sdk-core/package.json'),
	path.resolve(__dirname, '../packages/sdk-http/package.json'),
	path.resolve(__dirname, '../packages/sdk-perf/package.json'),
	path.resolve(__dirname, '../packages/sdk-perf-spa/package.json'),
	path.resolve(__dirname, '../packages/sdk-realtime/package.json'),
	path.resolve(__dirname, '../packages/sdk-telemetry/package.json'),
]


// 命令行参数
let nodeargv = process.argv
nodeargv = nodeargv.map((item) => {
	if(item.startsWith('-')) {
		return item.slice(2)
	}
	return item
})


// 根据命令行参数获取需要调整版本的sdk数组
const justifySDK = nodeargv.map(item => {
	let path
	packages.some(p => {
		if(p.includes(item)) {
			path = p
		}
	})
	return path
})

// 版本号修改函数
const justify = (path) => {
	// 如果传入的path为空，则返回
	if(!path) return
	fs.readFile(path, 'utf-8', (err, data) => {
		// 拿到原来的版本号
		const content = JSON.parse(data)
		const v = content.version
		// 将版本切割为大版本号，追加版本号和修订号
		let vArr = v.split('.')
		vArr = vArr.map(item => {
			return Number(item)
		});
		// 根据命令行参数选择需要提升的版本号
		if(nodeargv.includes('fixed')) {
			vArr[2]++
		} else if (nodeargv.includes('upgrade')) {
			vArr[1]++
			vArr[2] = 0
		} else if (nodeargv.includes('rebuild')) {
			vArr[0]++
			vArr[1] = 0
			vArr[2] = 0
		}
	
		const newContent = {...content, version: vArr.join('.')}
		fs.writeFileSync(path, JSON.stringify(newContent, null, 2) + '\n', 'utf8')
	})
}

// 遍历所有需要更改的sdk的package.json文件
for(const p of justifySDK) {
	justify(p)
}