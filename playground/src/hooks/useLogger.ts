import { useCallback, useState } from 'react'

export type LogType = 'info' | 'success' | 'error'

export interface LogEntry {
  timestamp: string
  type: LogType
  message: string
}

export const useLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])

  const log = useCallback((message: string, type: LogType = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const newEntry: LogEntry = { timestamp, type, message }
    
    setLogs(prev => [...prev, newEntry])
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return { logs, log, clearLogs }
}

export const formatLogEntry = (entry: LogEntry): string => {
  const prefix = entry.type === 'success' ? '✅' : entry.type === 'error' ? '❌' : 'ℹ️'
  return `[${entry.timestamp}] ${prefix} ${entry.message}`
}