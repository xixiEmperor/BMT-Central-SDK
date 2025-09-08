// ==================== Promise.allSettled vs Promise.all/race 对比演示 ====================

// 注意：由于ES模块限制，这里直接使用原生Promise进行演示
// 在实际项目中，你可以根据需要导入手写的Promise类
console.log('注意：此演示使用原生Promise，但概念适用于手写的Promise.allSettled');

// 模拟一些异步操作
const delay = (ms, value) => new Promise((resolve, reject) =>
  setTimeout(() => {
    if (value === 'error') {
      reject(new Error(`Failed after ${ms}ms`));
    } else {
      resolve(`${value} after ${ms}ms`);
    }
  }, ms)
);

console.log('=== Promise.allSettled vs Promise.all/race 对比 ===\n');

// 测试数据：包含成功和失败的Promise
const promises = [
  delay(100, 'task1'),      // 成功
  delay(200, 'task2'),      // 成功
  delay(50, 'error'),       // 失败
  delay(300, 'task4'),      // 成功
];

// 1. Promise.all - 遇到第一个失败就停止
console.log('1. Promise.all 测试（遇到失败就停止）');
Promise.all(promises)
  .then(results => {
    console.log('Promise.all 成功:', results);
  })
  .catch(error => {
    console.log('Promise.all 失败:', error.message);
    console.log('注意：后面的task4不会执行\n');
  });

// 2. Promise.race - 只返回第一个完成的结果
console.log('2. Promise.race 测试（只返回最快的结果）');
Promise.race(promises)
  .then(result => {
    console.log('Promise.race 成功:', result);
  })
  .catch(error => {
    console.log('Promise.race 失败:', error.message);
  });

// 3. Promise.allSettled - 等待所有完成，无论成功失败
console.log('\n3. Promise.allSettled 测试（等待所有完成）');
Promise.allSettled(promises)
  .then(results => {
    console.log('Promise.allSettled 所有结果:');
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`  [${index}] ✅ 成功: ${result.value}`);
      } else {
        console.log(`  [${index}] ❌ 失败: ${result.reason.message}`);
      }
    });
  });

// ==================== 使用场景演示 ====================

console.log('\n=== 使用场景对比 ===');

// 场景1: 获取多个API数据，即使某些失败也要显示其他成功的数据
console.log('\n场景1: API数据获取（某些可能失败）');
const apiCalls = [
  delay(100, '用户信息'),
  delay(150, 'error'),      // API调用失败
  delay(200, '订单信息'),
  delay(50, '商品信息'),
];

Promise.allSettled(apiCalls)
  .then(results => {
    console.log('API调用结果:');
    const successfulData = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const failedCount = results.filter(result => result.status === 'rejected').length;

    console.log(`成功获取 ${successfulData.length} 个数据:`, successfulData);
    console.log(`失败 ${failedCount} 个请求`);
  });

// 场景2: 批量文件上传
console.log('\n场景2: 批量文件上传（显示详细进度）');
const fileUploads = [
  delay(200, 'file1.jpg'),
  delay(100, 'error'),      // 上传失败
  delay(300, 'file3.png'),
  delay(150, 'file4.pdf'),
];

Promise.allSettled(fileUploads)
  .then(results => {
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    console.log(`上传完成: ${successCount} 成功, ${failCount} 失败`);

    results.forEach((result, index) => {
      const status = result.status === 'fulfilled' ? '✅' : '❌';
      const detail = result.status === 'fulfilled'
        ? result.value
        : result.reason.message;
      console.log(`  文件${index + 1}: ${status} ${detail}`);
    });
  });

// ==================== 与原生Promise对比 ====================

console.log('\n=== 与原生Promise.allSettled对比 ===');

// 使用原生Promise.allSettled（如果支持）
if (typeof Promise.allSettled === 'function') {
  console.log('原生Promise.allSettled结果:');
  Promise.allSettled([
    Promise.resolve('native1'),
    Promise.reject('native_error'),
    Promise.resolve('native3')
  ]).then(results => {
    console.log('原生结果:', results);
  });
} else {
  console.log('当前环境不支持原生Promise.allSettled');
}

/*
总结：
1. Promise.all: 全部成功才resolve，任何一个失败就reject
2. Promise.race: 返回最先完成的结果（成功或失败）
3. Promise.allSettled: 等待所有完成，返回详细的状态信息

适用场景：
- Promise.all: 需要全部成功的情况
- Promise.race: 只关心最快的结果（如超时处理）
- Promise.allSettled: 需要知道每个操作的详细状态（如批量操作、API调用统计）
*/
