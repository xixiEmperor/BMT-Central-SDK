import React from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'

const CoreSection: React.FC = () => {
  const { logs, log } = useLogger()

  const testTaskQueue = async () => {
    try {
      const { createTaskQueue } = await import('@platform/sdk-core')
      const queue = createTaskQueue<{ id: number }>({ concurrency: 2, timeout: 5000 })
      const start = Date.now()
      const tasks = Array.from({ length: 5 }, (_, i) => async () => {
        const ms = 500 + Math.random() * 1500
        await new Promise(r => setTimeout(r, ms))
        return { id: i + 1 }
      })
      const results = await Promise.all(tasks.map(t => queue.addTask(t)))
      const status = queue.getStatus()
      log(`TaskQueue 完成 ${results.length} 个任务，用时 ${Date.now() - start}ms，状态：${JSON.stringify(status)}`, 'success')
    } catch (e: any) {
      log(`TaskQueue 测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testRetry = async () => {
    try {
      const { withRetry } = await import('@platform/sdk-core')
      let attempt = 0
      const fn = async () => {
        attempt++
        if (attempt < 3) throw new Error(`第 ${attempt} 次失败`)
        return 'OK'
      }
      const result = await withRetry(fn, { retries: 3, baseMs: 200, jitter: true })
      log(`重试成功，结果：${result}，总尝试：${attempt}`, 'success')
    } catch (e: any) {
      log(`重试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testBroadcast = async () => {
    try {
      const { createBroadcast } = await import('@platform/sdk-core')
      const bc = createBroadcast<{ msg: string }>('demo')
      const un = bc.addEventListener((m) => {
        log(`收到广播：${m.data.msg}`)
        un()
        bc.close()
      })
      bc.postMessage('demo', { msg: '来自本页的广播消息' })
      log('已发送广播消息，建议在另一个 Tab 也打开本页面测试跨标签页', 'success')
    } catch (e: any) {
      log(`广播测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testLocks = async () => {
    try {
      const { withLock } = await import('@platform/sdk-core')
      log('开始测试互斥锁...', 'info')
      
      // 同时启动多个任务争抢同一个锁
      const promises = Array.from({ length: 3 }, async (_, i) => {
        const taskId = i + 1
        try {
          const result = await withLock(`test-lock`, async () => {
            log(`任务 ${taskId} 获得锁，开始执行...`, 'success')
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000)) // 模拟工作
            log(`任务 ${taskId} 执行完成`, 'success')
            return `任务 ${taskId} 完成`
          }, { timeoutMs: 5000 })
          return result
        } catch (error: any) {
          log(`任务 ${taskId} 失败：${error.message}`, 'error')
          throw error
        }
      })
      
      const results = await Promise.allSettled(promises)
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      log(`互斥锁测试完成：${succeeded}/3 个任务成功`, 'success')
    } catch (e: any) {
      log(`互斥锁测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testSDKManager = async () => {
    try {
      const { SDKManager, sdkManager } = await import('@platform/sdk-core')
      
      // 测试状态监听
      const unsubscribe = sdkManager.onStatusChange((status, prevStatus) => {
        log(`SDK状态变化：${prevStatus} -> ${status}`, 'info')
      })
      
      // 初始化SDK
      await sdkManager.init({
        name: 'playground-test',
        version: '1.0.0',
        environment: 'development',
        enableDevtools: true
      })
      
      log(`SDK Manager 初始化完成，状态：${sdkManager.getStatus()}`, 'success')
      log(`SDK信息：${JSON.stringify(sdkManager.getSDKInfo())}`, 'info')
      
      // 测试销毁
      setTimeout(async () => {
        await sdkManager.destroy()
        log(`SDK Manager 已销毁`, 'info')
        unsubscribe()
      }, 3000)
      
    } catch (e: any) {
      log(`SDK Manager 测试失败：${e?.message ?? e}`, 'error')
    }
  }

  return (
    <div className="sdk-section">
      <h2>📦 SDK Core</h2>
      <div className="button-group">
        <button onClick={testTaskQueue}>测试 TaskQueue</button>
        <button onClick={testRetry}>测试重试机制</button>
        <button onClick={testBroadcast}>测试跨标签页通信</button>
        <button onClick={testLocks}>测试互斥锁</button>
        <button onClick={testSDKManager}>测试 SDK Manager</button>
      </div>
      <LogArea logs={logs} />
    </div>
  )
}

export default CoreSection