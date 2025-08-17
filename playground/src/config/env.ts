/**
 * 环境配置管理
 * 统一管理所有环境变量和配置项
 */

export interface AppConfig {
  // API配置
  apiBaseUrl: string
  realtimeUrl: string
  telemetryEndpoint: string
  
  // 应用信息
  appName: string
  appVersion: string
  environment: string
  
  // 功能开关
  enableTelemetry: boolean
  enableRealtime: boolean
  enablePerformance: boolean
  
  // 调试配置
  debugMode: boolean
  consoleLog: boolean
}

// 获取环境变量的辅助函数
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return (import.meta.env as any)[key] || defaultValue
}

const getBooleanEnv = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvVar(key).toLowerCase()
  return value === 'true' || value === '1'
}

// 导出配置对象
export const config: AppConfig = {
  // API配置
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:5000'),
  realtimeUrl: getEnvVar('VITE_REALTIME_URL', 'ws://localhost:5000/realtime'),
  telemetryEndpoint: getEnvVar('VITE_TELEMETRY_ENDPOINT', 'http://localhost:5000/api/telemetry/events'),
  
  // 应用信息
  appName: getEnvVar('VITE_APP_NAME', 'playground'),
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  environment: getEnvVar('VITE_ENV', 'development'),
  
  // 功能开关
  enableTelemetry: getBooleanEnv('VITE_ENABLE_TELEMETRY', true),
  enableRealtime: getBooleanEnv('VITE_ENABLE_REALTIME', true),
  enablePerformance: getBooleanEnv('VITE_ENABLE_PERFORMANCE', true),
  
  // 调试配置
  debugMode: getBooleanEnv('VITE_DEBUG_MODE', true),
  consoleLog: getBooleanEnv('VITE_CONSOLE_LOG', true)
}

// 打印配置信息（仅在开发环境）
if (config.debugMode && config.environment === 'development') {
  console.log('🔧 应用配置:', config)
}

export default config
