import React from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'

const CoreSection: React.FC = () => {
  const { logs, log } = useLogger()

  const testTaskQueue = async () => {
    try {
      const { createTaskQueue } = await import('@platform/sdk-core')
      const queue = createTaskQueue<{ id: number }>({ concurrency: 2, timeoutMs: 5000 })
      const start = Date.now()
      const tasks = Array.from({ length: 5 }, (_, i) => async () => {
        const ms = 500 + Math.random() * 1500
        await new Promise(r => setTimeout(r, ms))
        return { id: i + 1 }
      })
      const results = await Promise.all(tasks.map(t => queue.add(t)))
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

  return (
    <div className="sdk-section">
      <h2>📦 SDK Core</h2>
      <div className="button-group">
        <button onClick={testTaskQueue}>测试 TaskQueue</button>
        <button onClick={testRetry}>测试重试机制</button>
        <button onClick={testBroadcast}>测试跨标签页通信</button>
      </div>
      <LogArea logs={logs} />
    </div>
  )
}

export default CoreSection