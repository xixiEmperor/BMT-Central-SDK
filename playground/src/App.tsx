import React from 'react'
import './App.css'
import CoreSection from './components/CoreSection'
import HttpSection from './components/HttpSection'
import PerformanceSection from './components/PerformanceSection'
import TelemetrySection from './components/TelemetrySection'
import RealtimeSection from './components/RealtimeSection'

const App: React.FC = () => {
  return (
    <div className="container">
      <h1>🚀 BMT Platform SDK 测试沙箱</h1>
      
      <CoreSection />
      <HttpSection />
      <PerformanceSection />
      <TelemetrySection />
      <RealtimeSection />
    </div>
  )
}

export default App