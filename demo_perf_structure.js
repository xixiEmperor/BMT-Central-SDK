// 演示PerformanceObserver的数据结构
console.log('=== 浏览器Performance API数据结构 ===');
console.log();

// 1. Performance.getEntries() - 全局性能条目列表
console.log('1. performance.getEntries() 返回:');
console.log('   - 类型: PerformanceEntry[] (一维数组)');
console.log('   - 每个元素: PerformanceEntry对象');
console.log('   - 示例: [navEntry, resourceEntry1, resourceEntry2, longtaskEntry, ...]');
console.log();

// 2. PerformanceObserverEntryList.getEntries()
console.log('2. PerformanceObserverEntryList.getEntries() 返回:');
console.log('   - 类型: PerformanceEntry[] (一维数组)');
console.log('   - 每个元素: 符合观察类型的PerformanceEntry子类对象');
console.log();

// 3. 具体类型的条目结构
console.log('3. 不同entryType的条目结构:');
console.log('   Resource条目:');
console.log('   {');
console.log('     entryType: "resource",');
console.log('     name: "https://example.com/api/data",');
console.log('     startTime: 100.5,');
console.log('     duration: 234.67,');
console.log('     fetchStart: 100.5,');
console.log('     responseEnd: 335.17,');
console.log('     // ... 其他资源特定属性');
console.log('   }');
console.log();

console.log('   Longtask条目:');
console.log('   {');
console.log('     entryType: "longtask",');
console.log('     name: "self",');
console.log('     startTime: 1500.0,');
console.log('     duration: 89.45,');
console.log('     // 长任务特有属性');
console.log('   }');
console.log();

// 4. 多条目时的结构
console.log('4. 多个条目时的完整数据结构:');
console.log('   entries = [');
console.log('     { entryType: "resource", name: "/api/user", ... },');
console.log('     { entryType: "resource", name: "/api/data", ... },');
console.log('     { entryType: "resource", name: "image.jpg", ... },');
console.log('     { entryType: "longtask", name: "self", startTime: 1000, duration: 75 },');
console.log('     { entryType: "longtask", name: "self", startTime: 2000, duration: 120 },');
console.log('     { entryType: "navigation", name: "navigation", ... }');
console.log('   ]');
console.log();

// 5. 关键事实
console.log('5. 关键事实:');
console.log('   ✅ 永远是一维数组: PerformanceEntry[]');
console.log('   ✅ 每个条目都是独立的对象');
console.log('   ✅ 通过entryType属性区分类型');
console.log('   ❌ 不是二维数组');
console.log('   ❌ 不是嵌套结构');
console.log('   ❌ 条目内部不包含子条目数组');
