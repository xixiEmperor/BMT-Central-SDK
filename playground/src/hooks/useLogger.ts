import { useCallback, useState } from 'react'

export type LogType = 'info' | 'success' | 'error' | 'warning'

export interface LogEntry {
  timestamp: string
  type: LogType
  message: string
  details?: any // 用于存储详细信息，如API响应
}

// 错误解析辅助函数
export const parseError = (error: any): { message: string; details?: any } => {
  if (error?.response) {
    // HTTP错误响应
    const status = error.response.status
    const statusText = error.response.statusText
    const data = error.response.data
    
    return {
      message: `HTTP ${status} ${statusText}`,
      details: {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status,
        statusText,
        data
      }
    }
  }
  
  if (error?.code) {
    // 网络错误或其他错误码
    return {
      message: `网络错误: ${error.code} - ${error.message}`,
      details: {
        code: error.code,
        message: error.message,
        stack: error.stack
      }
    }
  }
  
  // 普通错误
  return {
    message: error?.message || String(error),
    details: error?.stack ? { stack: error.stack } : undefined
  }
}

// API响应格式化
export const formatApiResponse = (response: any): string => {
  if (!response) return 'null'
  
  if (typeof response === 'string') {
    return response.length > 200 ? response.slice(0, 200) + '...' : response
  }
  
  if (typeof response === 'object') {
    const jsonStr = JSON.stringify(response, null, 2)
    return jsonStr.length > 500 ? JSON.stringify(response) : jsonStr
  }
  
  return String(response)
}

export const useLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])

  const log = useCallback((message: string, type: LogType = 'info', details?: any) => {
    const timestamp = new Date().toLocaleTimeString()
    const newEntry: LogEntry = { timestamp, type, message, details }
    
    setLogs(prev => [...prev, newEntry])
    
    // 同时输出到控制台
    const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'
    console[consoleMethod](`[${timestamp}] ${message}`, details || '')
  }, [])

  const logError = useCallback((error: any, context?: string) => {
    const { message, details } = parseError(error)
    const fullMessage = context ? `${context}: ${message}` : message
    log(fullMessage, 'error', details)
  }, [log])

  const logSuccess = useCallback((message: string, response?: any) => {
    const details = response ? { response } : undefined
    log(message, 'success', details)
  }, [log])

  const logApiCall = useCallback((method: string, url: string, response?: any, error?: any) => {
    if (error) {
      const { message, details } = parseError(error)
      log(`${method} ${url} 失败: ${message}`, 'error', details)
    } else {
      const responseStr = formatApiResponse(response)
      log(`${method} ${url} 成功: ${responseStr}`, 'success', { response })
    }
  }, [log])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return { logs, log, logError, logSuccess, logApiCall, clearLogs }
}

export const formatLogEntry = (entry: LogEntry): string => {
  const getPrefix = (type: LogType) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }
  
  return `[${entry.timestamp}] ${getPrefix(entry.type)} ${entry.message}`
}