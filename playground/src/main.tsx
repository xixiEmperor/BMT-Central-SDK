import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

console.log('🚀 BMT Platform SDK Playground 启动中...')

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

console.log('🎉 BMT Platform SDK Playground 初始化完成！所有模块已集成，可开始全面测试')