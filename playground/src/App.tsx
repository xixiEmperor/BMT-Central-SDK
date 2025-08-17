import React from 'react'
import './App.css'
import CoreSection from './components/CoreSection'
import HttpSection from './components/HttpSection'
import PerformanceSection from './components/PerformanceSection'
import TelemetrySection from './components/TelemetrySection'
import RealtimeSection from './components/RealtimeSection'
import AdaptersSection from './components/AdaptersSection'
import { config } from './config/env'

const App: React.FC = () => {
  return (
    <div className="container">
      <h1>🚀 BMT Platform SDK 测试沙箱</h1>
      <div className="section-info">
        <p>🔗 后端API地址：<code>{config.apiBaseUrl}</code></p>
        <p>🔗 WebSocket地址：<code>{config.realtimeUrl}</code></p>
        <p>📡 遥测端点：<code>{config.telemetryEndpoint}</code></p>
        <p>🏷️ 应用信息：<code>{config.appName} v{config.appVersion}</code></p>
        <p>🌍 环境：<code>{config.environment}</code></p>
        <p>✅ 所有SDK模块已集成完成，可以进行完整功能测试</p>
      </div>
      
      <CoreSection />
      <HttpSection />
      <PerformanceSection />
      <TelemetrySection />
      <RealtimeSection />
      <AdaptersSection />
    </div>
  )
}

export default App