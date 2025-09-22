// JavaScript 读代码输出题目集合
// 涵盖 this 指向、自由变量、闭包、作用域等核心概念

console.log('=== JavaScript 读代码输出题目 ===\n');

// ==================== 题目1：this指向 - 普通函数调用 ====================
console.log('题目1：this指向 - 普通函数调用');
function test1() {
    console.log('题目1 - 请问下面代码的输出是什么？');
    console.log(`
function foo() {
    console.log(this.a);
}

var a = 2;
foo();
    `);
}

// 答案：2（非严格模式下，普通函数调用this指向全局对象）

// ==================== 题目2：this指向 - 对象方法调用 ====================
console.log('\n题目2：this指向 - 对象方法调用');
function test2() {
    console.log('题目2 - 请问下面代码的输出是什么？');
    console.log(`
var obj = {
    a: 3,
    foo: function() {
        console.log(this.a);
    }
};

var a = 2;
obj.foo();
    `);
}

// 答案：3（对象方法调用，this指向调用对象）

// ==================== 题目3：this指向 - 箭头函数 ====================
console.log('\n题目3：this指向 - 箭头函数');
function test3() {
    console.log('题目3 - 请问下面代码的输出是什么？');
    console.log(`
var obj = {
    a: 3,
    foo: () => {
        console.log(this.a);
    }
};

var a = 2;
obj.foo();
    `);
}

// 答案：2（箭头函数没有自己的this，继承外层作用域的this，这里是全局对象）

// ==================== 题目4：this指向 - call/apply/bind ====================
console.log('\n题目4：this指向 - call/apply/bind');
function test4() {
    console.log('题目4 - 请问下面代码的输出是什么？');
    console.log(`
function foo() {
    console.log(this.a);
}

var obj1 = { a: 2 };
var obj2 = { a: 3 };

foo.call(obj1);
foo.apply(obj2);
    `);
}

// 答案：2, 3（显式绑定this）

// ==================== 题目5：闭包 - 基础闭包 ====================
console.log('\n题目5：闭包 - 基础闭包');
function test5() {
    console.log('题目5 - 请问下面代码的输出是什么？');
    console.log(`
function outer() {
    var a = 1;
    return function inner() {
        console.log(a);
        a++;
    };
}

var fn = outer();
fn();
fn();
    `);
}

// 答案：1, 2（闭包保持对外部变量的引用）

// ==================== 题目6：闭包 - 循环中的闭包 ====================
console.log('\n题目6：闭包 - 循环中的闭包');
function test6() {
    console.log('题目6 - 请问下面代码的输出是什么？');
    console.log(`
for (var i = 0; i < 3; i++) {
    setTimeout(function() {
        console.log(i);
    }, 100);
}
    `);
}

// 答案：3, 3, 3（var声明的变量在循环结束后i=3，所有setTimeout回调都引用同一个i）

// ==================== 题目7：闭包 - 循环中的闭包解决方案 ====================
console.log('\n题目7：闭包 - 循环中的闭包解决方案');
function test7() {
    console.log('题目7 - 请问下面代码的输出是什么？');
    console.log(`
for (var i = 0; i < 3; i++) {
    (function(j) {
        setTimeout(function() {
            console.log(j);
        }, 100);
    })(i);
}
    `);
}

// 答案：0, 1, 2（IIFE创建了新的作用域，每次循环都保存了当前的i值）

// ==================== 题目8：作用域链和自由变量 ====================
console.log('\n题目8：作用域链和自由变量');
function test8() {
    console.log('题目8 - 请问下面代码的输出是什么？');
    console.log(`
var a = 1;
function foo() {
    var a = 2;
    function bar() {
        console.log(a);
    }
    return bar;
}

var baz = foo();
baz();
    `);
}

// 答案：2（bar函数中的a是自由变量，沿着作用域链找到foo函数中的a=2）

// ==================== 题目9：变量提升和函数提升 ====================
console.log('\n题目9：变量提升和函数提升');
function test9() {
    console.log('题目9 - 请问下面代码的输出是什么？');
    console.log(`
console.log(a);
console.log(foo);

var a = 1;
function foo() {
    return 2;
}
    `);
}

// 答案：undefined, [Function: foo]（变量提升但未赋值，函数声明完全提升）

// ==================== 题目10：综合题 - this + 闭包 ====================
console.log('\n题目10：综合题 - this + 闭包');
function test10() {
    console.log('题目10 - 请问下面代码的输出是什么？');
    console.log(`
var obj = {
    name: 'obj',
    getName: function() {
        return function() {
            console.log(this.name);
        };
    }
};

var name = 'global';
var fn = obj.getName();
fn();
    `);
}

// 答案：'global'（内部函数作为普通函数调用，this指向全局对象）

// ==================== 题目11：let/const 与 var 的区别 ====================
console.log('\n题目11：let/const 与 var 的区别');
function test11() {
    console.log('题目11 - 请问下面代码的输出是什么？');
    console.log(`
for (let i = 0; i < 3; i++) {
    setTimeout(function() {
        console.log(i);
    }, 100);
}
    `);
}

// 答案：0, 1, 2（let声明的变量具有块级作用域，每次循环都创建新的绑定）

// ==================== 题目12：复杂闭包 ====================
console.log('\n题目12：复杂闭包');
function test12() {
    console.log('题目12 - 请问下面代码的输出是什么？');
    console.log(`
function createCounter() {
    var count = 0;
    return {
        increment: function() {
            count++;
            return count;
        },
        decrement: function() {
            count--;
            return count;
        },
        getCount: function() {
            return count;
        }
    };
}

var counter = createCounter();
console.log(counter.increment());
console.log(counter.increment());
console.log(counter.decrement());
console.log(counter.getCount());
    `);
}

// 答案：1, 2, 1, 1（闭包保持对count变量的引用，多个方法共享同一个count）

// ==================== 题目13：this绑定优先级 ====================
console.log('\n题目13：this绑定优先级');
function test13() {
    console.log('题目13 - 请问下面代码的输出是什么？');
    console.log(`
function foo() {
    console.log(this.a);
}

var obj1 = { a: 2, foo: foo };
var obj2 = { a: 3 };

obj1.foo();
obj1.foo.call(obj2);
    `);
}

// 答案：2, 3（显式绑定优先级高于隐式绑定）

// ==================== 题目14：箭头函数与普通函数的this ====================
console.log('\n题目14：箭头函数与普通函数的this');
function test14() {
    console.log('题目14 - 请问下面代码的输出是什么？');
    console.log(`
var obj = {
    name: 'obj',
    regularFunction: function() {
        console.log('regular:', this.name);
        var arrowFunction = () => {
            console.log('arrow:', this.name);
        };
        arrowFunction();
    }
};

var name = 'global';
obj.regularFunction();
    `);
}

// 答案：'regular: obj', 'arrow: obj'（箭头函数继承外层函数的this）

// ==================== 题目15：复杂的作用域链 ====================
console.log('\n题目15：复杂的作用域链');
function test15() {
    console.log('题目15 - 请问下面代码的输出是什么？');
    console.log(`
var x = 1;
function a() {
    var x = 2;
    function b() {
        var x = 3;
        function c() {
            console.log(x);
        }
        c();
    }
    b();
}
a();
    `);
}

// 答案：3（c函数中查找x，沿着作用域链找到b函数中的x=3）

// 运行所有测试题目的描述
console.log('\n=== 运行所有题目描述 ===');
test1();
test2();
test3();
test4();
test5();
test6();
test7();
test8();
test9();
test10();
test11();
test12();
test13();
test14();
test15();

console.log('\n=== 答案解析请参考注释 ===');
