// BMT Platform SDK Playground 主入口
// 在这里我们将测试所有 SDK 包的功能

// 等所有 SDK 包实现后，这里会包含完整的集成测试

console.log('🚀 BMT Platform SDK Playground 启动中...')

// 临时的日志辅助函数
function log(sectionId: string, message: string, type: 'info' | 'success' | 'error' = 'info') {
  const logArea = document.getElementById(`${sectionId}-log`)
  if (logArea) {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
    logArea.textContent += `[${timestamp}] ${prefix} ${message}\n`
    logArea.scrollTop = logArea.scrollHeight
  }
}

// 初始化按钮事件监听
document.addEventListener('DOMContentLoaded', () => {
  // SDK Core 测试
  document.getElementById('test-task-queue')?.addEventListener('click', () => {
    log('core', 'TaskQueue 功能尚未实现', 'error')
  })

  document.getElementById('test-retry')?.addEventListener('click', () => {
    log('core', '重试机制尚未实现', 'error')
  })

  document.getElementById('test-broadcast')?.addEventListener('click', () => {
    log('core', '跨标签页通信尚未实现', 'error')
  })

  // SDK HTTP 测试
  document.getElementById('test-http-get')?.addEventListener('click', () => {
    log('http', 'HTTP GET 功能尚未实现', 'error')
  })

  document.getElementById('test-http-error')?.addEventListener('click', () => {
    log('http', 'HTTP 错误处理尚未实现', 'error')
  })

  document.getElementById('test-retry-http')?.addEventListener('click', () => {
    log('http', 'HTTP 重试机制尚未实现', 'error')
  })

  document.getElementById('test-circuit-breaker')?.addEventListener('click', () => {
    log('http', 'HTTP 熔断器尚未实现', 'error')
  })

  // SDK Performance 测试
  document.getElementById('test-web-vitals')?.addEventListener('click', () => {
    log('perf', 'Web Vitals 监控尚未实现', 'error')
  })

  document.getElementById('test-user-timing')?.addEventListener('click', () => {
    log('perf', 'User Timing 功能尚未实现', 'error')
  })

  document.getElementById('test-performance-observer')?.addEventListener('click', () => {
    log('perf', 'Performance Observer 尚未实现', 'error')
  })

  // SDK Telemetry 测试
  document.getElementById('test-track-event')?.addEventListener('click', () => {
    log('telemetry', '事件跟踪尚未实现', 'error')
  })

  document.getElementById('test-page-view')?.addEventListener('click', () => {
    log('telemetry', '页面浏览统计尚未实现', 'error')
  })

  document.getElementById('test-error-tracking')?.addEventListener('click', () => {
    log('telemetry', '错误跟踪尚未实现', 'error')
  })

  document.getElementById('test-flush')?.addEventListener('click', () => {
    log('telemetry', '强制上报尚未实现', 'error')
  })

  // SDK Realtime 测试
  document.getElementById('test-connect')?.addEventListener('click', () => {
    log('realtime', '实时连接尚未实现', 'error')
  })

  document.getElementById('test-subscribe')?.addEventListener('click', () => {
    log('realtime', '消息订阅尚未实现', 'error')
  })

  document.getElementById('test-publish')?.addEventListener('click', () => {
    log('realtime', '消息发布尚未实现', 'error')
  })

  document.getElementById('test-disconnect')?.addEventListener('click', () => {
    log('realtime', '断开连接尚未实现', 'error')
  })

  log('core', 'Playground 初始化完成，等待 SDK 实现...')
})