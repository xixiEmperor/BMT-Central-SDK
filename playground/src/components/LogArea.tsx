import React, { useEffect, useRef } from 'react'
import { LogEntry, formatLogEntry } from '../hooks/useLogger'

interface LogAreaProps {
  logs: LogEntry[]
  placeholder?: string
}

const LogArea: React.FC<LogAreaProps> = ({ logs, placeholder = '等待测试...' }) => {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div ref={logRef} className="log-area">
      {logs.length === 0 
        ? placeholder 
        : logs.map((entry, index) => 
            <div key={index}>{formatLogEntry(entry)}</div>
          )
      }
    </div>
  )
}

export default LogArea