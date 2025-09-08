const str = 'you_suck_my_dick'

const revert = (str) => {
    let res = []
    let temp = ''
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '_') {
            res.push(temp)
            temp = ''
        } else {
            if (str[i - 1] === '_' || i === 0) {
                const upStr = str[i].toUpperCase()
                temp = temp + upStr
            } else {
                temp += str[i]
            }

        }
    }
    res.push(temp)
    return res.join('')
}

console.log(revert(str))