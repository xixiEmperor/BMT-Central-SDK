# @platform/sdk-telemetry

BMT 平台 SDK 遥测数据收集模块，提供统一的事件模型、批量缓冲上报、跨标签页去重和 Beacon 兜底等完整的遥测数据收集解决方案。

## 🚀 特性

- **统一事件模型**：标准化的事件类型和数据结构
- **批量缓冲上报**：智能批量处理，减少网络请求
- **跨标签页去重**：避免多标签页重复上报数据
- **Beacon 兜底**：页面卸载时使用 sendBeacon 确保数据上报
- **本地存储**：离线时数据本地缓存，网络恢复后自动上报
- **采样控制**：灵活的采样率配置，控制数据上报量
- **错误处理**：完善的错误处理和重试机制
- **TypeScript 支持**：完整的类型定义和 IntelliSense 支持

## 📦 安装

```bash
npm install @platform/sdk-telemetry
```

## 🎯 核心模块

### Telemetry 主类

遥测系统的主入口，提供完整的事件跟踪和数据上报能力。

#### 🚀 快速开始

```typescript
import { Telemetry } from '@platform/sdk-telemetry'

// 初始化遥测
Telemetry.init({
  app: 'my-app',
  release: '1.0.0',
  endpoint: 'https://api.example.com/telemetry',
  debug: true
})

// 设置用户信息
Telemetry.setUser({
  id: 'user_123',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user'
})

// 跟踪页面浏览
Telemetry.trackPageView('/dashboard', {
  title: 'Dashboard',
  loadTime: 1200,
  referrer: document.referrer
})

// 跟踪自定义事件
Telemetry.trackEvent('button_click', {
  buttonId: 'save-btn',
  section: 'settings',
  timestamp: Date.now()
})

// 跟踪错误
Telemetry.trackError('javascript_error', 'TypeError: Cannot read property...', {
  file: 'app.js',
  line: 42,
  column: 15
})
```

#### 🔧 高级配置

```typescript
import { Telemetry } from '@platform/sdk-telemetry'

// 完整配置示例
Telemetry.init({
  // 基础信息
  app: 'my-app',
  release: '1.0.0',
  environment: 'production',
  
  // 上报配置
  endpoint: 'https://api.example.com/v1/telemetry/ingest',
  batchSize: 50,              // 批次大小
  flushInterval: 5000,        // 刷新间隔 5 秒
  maxBatchEvents: 200,        // 最大批次事件数
  maxEventSize: 10240,        // 单个事件最大大小 10KB
  
  // 采样配置
  sampleRate: 0.1,            // 采样率 10%
  errorSampleRate: 1.0,       // 错误事件采样率 100%
  performanceSampleRate: 0.05, // 性能事件采样率 5%
  
  // 存储配置
  enableLocalStorage: true,   // 启用本地存储
  maxStorageSize: 5242880,    // 最大存储大小 5MB
  storageCleanupInterval: 3600000, // 存储清理间隔 1 小时
  
  // 功能开关
  enableBeacon: true,         // 启用 Beacon 兜底
  enableCrossTabDedup: true,  // 启用跨标签页去重
  enableAutoPageTracking: true, // 启用自动页面跟踪
  enableAutoErrorTracking: true, // 启用自动错误跟踪
  
  // 过滤器
  beforeSend: (event) => {
    // 事件发送前的过滤和处理
    if (event.type === 'error' && event.data.message?.includes('Script error')) {
      return null // 过滤脚本错误
    }
    return event
  },
  
  // 回调函数
  onSuccess: (batch) => {
    console.log('遥测数据上报成功:', batch.length)
  },
  
  onError: (error, batch) => {
    console.error('遥测数据上报失败:', error)
  },
  
  onStorageWarning: (usage, limit) => {
    console.warn(`存储使用量警告: ${usage}/${limit}`)
  },
  
  // 调试配置
  debug: process.env.NODE_ENV === 'development'
})
```

### 事件跟踪

提供多种类型的事件跟踪方法。

#### 📄 页面跟踪

```typescript
// 基础页面跟踪
Telemetry.trackPageView('/home')

// 详细页面跟踪
Telemetry.trackPageView('/products/123', {
  title: 'Product Details - iPhone 13',
  category: 'products',
  loadTime: 800,
  referrer: '/search?q=iphone',
  searchQuery: 'iphone',
  userId: 'user_123'
})

// 单页应用路由变化跟踪
function trackRouteChange(to: string, from: string) {
  Telemetry.trackPageView(to, {
    from,
    title: document.title,
    loadTime: performance.now(),
    navigationMode: 'spa'
  })
}

// 自动页面跟踪（已启用的情况下）
// 会自动监听 popstate 和 pushstate 事件
```

#### 🎯 自定义事件跟踪

```typescript
// 用户交互事件
Telemetry.trackEvent('button_click', {
  buttonId: 'download-btn',
  buttonText: 'Download App',
  section: 'hero',
  position: { x: 100, y: 200 }
})

// 业务事件
Telemetry.trackEvent('purchase_completed', {
  orderId: 'order_123',
  amount: 99.99,
  currency: 'USD',
  items: [
    { id: 'item_1', name: 'iPhone Case', price: 29.99 },
    { id: 'item_2', name: 'Screen Protector', price: 19.99 }
  ],
  paymentMethod: 'credit_card'
})

// 表单事件
Telemetry.trackEvent('form_submitted', {
  formId: 'contact-form',
  formType: 'contact',
  fields: ['name', 'email', 'message'],
  validationErrors: [],
  timeFilled: 45000 // 填写耗时 45 秒
})

// 搜索事件
Telemetry.trackEvent('search_performed', {
  query: 'wireless headphones',
  resultsCount: 24,
  filters: { brand: 'Apple', priceRange: '100-200' },
  searchDuration: 1200
})
```

#### ❌ 错误跟踪

```typescript
// JavaScript 错误跟踪
try {
  someRiskyOperation()
} catch (error) {
  Telemetry.trackError('operation_failed', error.message, {
    operation: 'someRiskyOperation',
    stack: error.stack,
    timestamp: Date.now(),
    userId: getCurrentUserId(),
    additionalContext: { /* 额外上下文 */ }
  })
}

// API 错误跟踪
fetch('/api/users')
  .then(response => {
    if (!response.ok) {
      Telemetry.trackError('api_error', `HTTP ${response.status}`, {
        url: '/api/users',
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
    }
    return response.json()
  })
  .catch(error => {
    Telemetry.trackError('network_error', error.message, {
      url: '/api/users',
      method: 'GET',
      errorType: 'NetworkError'
    })
  })

// 自动错误跟踪（已启用的情况下）
// 会自动监听 window.onerror 和 window.onunhandledrejection
window.addEventListener('error', (event) => {
  // 自动跟踪未捕获的 JavaScript 错误
})

window.addEventListener('unhandledrejection', (event) => {
  // 自动跟踪未处理的 Promise 拒绝
})
```

#### 📊 性能跟踪

```typescript
// API 性能跟踪
const startTime = performance.now()
const response = await fetch('/api/data')
const endTime = performance.now()

Telemetry.trackEvent('api_performance', {
  url: '/api/data',
  method: 'GET',
  duration: endTime - startTime,
  status: response.status,
  size: response.headers.get('content-length'),
  cacheStatus: response.headers.get('cache-control')
})

// 自定义性能指标
Telemetry.trackPerformance('custom_operation', {
  operation: 'data_processing',
  duration: 500,
  recordsProcessed: 1000,
  memoryUsage: performance.memory?.usedJSHeapSize
})

// 资源加载性能
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    Telemetry.trackPerformance('resource_load', {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      type: entry.initiatorType
    })
  })
})
observer.observe({ entryTypes: ['resource'] })
```

### 事件构建器

提供便捷的事件构建函数。

#### 🏗️ 预设事件构建器

```typescript
import { 
  createPageEvent,
  createCustomEvent,
  createErrorEvent,
  createApiEvent,
  createPerfEvent 
} from '@platform/sdk-telemetry'

// 创建页面事件
const pageEvent = createPageEvent('/dashboard', {
  title: 'Dashboard',
  loadTime: 1200
})
Telemetry.track(pageEvent)

// 创建自定义事件
const customEvent = createCustomEvent('user_action', {
  action: 'download',
  resource: 'app'
})
Telemetry.track(customEvent)

// 创建错误事件
const errorEvent = createErrorEvent('validation_error', 'Email is required', {
  field: 'email',
  formId: 'signup-form'
})
Telemetry.track(errorEvent)

// 创建 API 事件
const apiEvent = createApiEvent('/api/users', 'GET', {
  duration: 300,
  status: 200,
  cached: false
})
Telemetry.track(apiEvent)

// 创建性能事件
const perfEvent = createPerfEvent('page_load', {
  duration: 2500,
  resources: 15,
  domElements: 400
})
Telemetry.track(perfEvent)
```

### 批量处理

智能的批量处理和上报机制。

#### 📦 批量配置

```typescript
import { TelemetryBatcher } from '@platform/sdk-telemetry'

// 创建自定义批处理器
const batcher = new TelemetryBatcher({
  maxBatchSize: 50,           // 最大批次大小
  flushInterval: 5000,        // 刷新间隔 5 秒
  maxWaitTime: 10000,         // 最大等待时间 10 秒
  
  // 自定义上报逻辑
  onFlush: async (events) => {
    console.log('上报事件批次:', events.length)
    
    try {
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('批次上报失败:', error)
      throw error
    }
  },
  
  // 批次过滤器
  beforeFlush: (events) => {
    // 过滤敏感数据
    return events.filter(event => !event.data?.sensitive)
  }
})

// 添加事件到批处理器
batcher.add({
  type: 'custom',
  timestamp: Date.now(),
  data: { action: 'user_login' }
})

// 手动刷新
await batcher.flush()

// 清理资源
batcher.destroy()
```

#### ⚡ 实时上报

```typescript
// 强制实时上报（跳过批处理）
Telemetry.trackEvent('critical_error', {
  error: 'Payment processing failed',
  orderId: 'order_123',
  amount: 99.99
}, {
  immediate: true // 立即上报，不等待批处理
})

// 高优先级事件
Telemetry.trackEvent('security_alert', {
  alertType: 'suspicious_login',
  userId: 'user_123',
  ip: '192.168.1.1'
}, {
  priority: 'high',
  immediate: true
})
```

### 存储管理

本地存储和离线支持。

#### 💾 存储配置

```typescript
import { TelemetryStorage } from '@platform/sdk-telemetry'

// 自定义存储配置
const storage = new TelemetryStorage({
  maxSize: 5242880,           // 最大存储 5MB
  cleanupInterval: 3600000,   // 清理间隔 1 小时
  retentionPeriod: 604800000, // 数据保留 7 天
  
  // 存储策略
  storageStrategy: 'lru',     // LRU 淘汰策略
  compressionEnabled: true,   // 启用压缩
  
  // 回调函数
  onStorageFull: (usage, limit) => {
    console.warn('存储空间已满:', usage, limit)
  },
  
  onCleanup: (removedCount, freedSpace) => {
    console.log('清理存储:', removedCount, freedSpace)
  }
})

// 手动存储操作
await storage.store('key', eventData)
const data = await storage.retrieve('key')
await storage.remove('key')
await storage.clear()

// 获取存储信息
const info = await storage.getStorageInfo()
console.log('存储信息:', {
  used: info.used,
  available: info.available,
  percentage: info.percentage
})
```

#### 🔄 离线支持

```typescript
// 离线检测和处理
Telemetry.init({
  // ... 其他配置
  
  // 离线处理
  onOffline: () => {
    console.log('网络离线，事件将缓存到本地')
  },
  
  onOnline: () => {
    console.log('网络恢复，开始上报缓存事件')
    // 自动上报缓存的事件
  },
  
  // 网络状态检测间隔
  networkCheckInterval: 30000 // 30 秒检测一次
})

// 手动处理离线缓存
if (!navigator.onLine) {
  // 离线状态，事件会自动缓存
  Telemetry.trackEvent('offline_action', { action: 'data_save' })
}

// 网络恢复时手动同步
window.addEventListener('online', () => {
  Telemetry.syncOfflineEvents()
})
```

## 📊 使用场景

### 1. Web 应用用户行为分析

```typescript
import { Telemetry } from '@platform/sdk-telemetry'

class UserAnalytics {
  constructor() {
    this.initializeTelemetry()
    this.setupEventTracking()
  }
  
  private initializeTelemetry() {
    Telemetry.init({
      app: 'web-app',
      release: '2.1.0',
      environment: 'production',
      endpoint: 'https://analytics.example.com/events',
      sampleRate: 0.1,
      enableAutoPageTracking: true,
      enableAutoErrorTracking: true
    })
    
    // 设置用户信息
    const user = this.getCurrentUser()
    if (user) {
      Telemetry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      })
    }
  }
  
  private setupEventTracking() {
    // 跟踪按钮点击
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.closest('button')
        this.trackButtonClick(button)
      }
    })
    
    // 跟踪表单提交
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      this.trackFormSubmission(form)
    })
    
    // 跟踪搜索
    this.setupSearchTracking()
  }
  
  private trackButtonClick(button: HTMLElement) {
    Telemetry.trackEvent('button_click', {
      buttonId: button.id,
      buttonText: button.textContent?.trim(),
      section: this.getElementSection(button),
      page: window.location.pathname,
      timestamp: Date.now()
    })
  }
  
  private trackFormSubmission(form: HTMLFormElement) {
    const formData = new FormData(form)
    const fields = Array.from(formData.keys())
    
    Telemetry.trackEvent('form_submit', {
      formId: form.id,
      formAction: form.action,
      fieldCount: fields.length,
      fields: fields,
      page: window.location.pathname
    })
  }
  
  private setupSearchTracking() {
    const searchInput = document.querySelector('#search-input') as HTMLInputElement
    if (searchInput) {
      let searchTimeout: number
      
      searchInput.addEventListener('input', (event) => {
        clearTimeout(searchTimeout)
        searchTimeout = window.setTimeout(() => {
          const query = (event.target as HTMLInputElement).value
          if (query.length >= 3) {
            this.trackSearch(query)
          }
        }, 500) // 防抖 500ms
      })
    }
  }
  
  private trackSearch(query: string) {
    Telemetry.trackEvent('search_performed', {
      query,
      queryLength: query.length,
      page: window.location.pathname,
      timestamp: Date.now()
    })
  }
  
  // 跟踪业务事件
  trackPurchase(order: any) {
    Telemetry.trackEvent('purchase_completed', {
      orderId: order.id,
      amount: order.total,
      currency: order.currency,
      itemCount: order.items.length,
      paymentMethod: order.paymentMethod,
      discount: order.discount
    })
  }
  
  trackFeatureUsage(feature: string, context: any = {}) {
    Telemetry.trackEvent('feature_used', {
      feature,
      ...context,
      timestamp: Date.now()
    })
  }
}

// 初始化用户分析
const analytics = new UserAnalytics()
```

### 2. React 应用集成

```typescript
// hooks/useTelemetry.ts
import { useEffect, useCallback } from 'react'
import { Telemetry } from '@platform/sdk-telemetry'

export function useTelemetry() {
  // 页面跟踪 Hook
  const trackPage = useCallback((path: string, data?: any) => {
    Telemetry.trackPageView(path, {
      ...data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`
    })
  }, [])
  
  // 事件跟踪 Hook
  const trackEvent = useCallback((type: string, data?: any) => {
    Telemetry.trackEvent(type, {
      ...data,
      timestamp: Date.now()
    })
  }, [])
  
  // 错误跟踪 Hook
  const trackError = useCallback((error: Error, context?: any) => {
    Telemetry.trackError('react_error', error.message, {
      stack: error.stack,
      component: context?.component,
      props: context?.props,
      ...context
    })
  }, [])
  
  return { trackPage, trackEvent, trackError }
}

// components/TelemetryProvider.tsx
import React, { createContext, useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Telemetry } from '@platform/sdk-telemetry'
import { useTelemetry } from '../hooks/useTelemetry'

const TelemetryContext = createContext<ReturnType<typeof useTelemetry> | null>(null)

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const telemetry = useTelemetry()
  
  // 自动跟踪路由变化
  useEffect(() => {
    telemetry.trackPage(location.pathname, {
      title: document.title,
      referrer: document.referrer
    })
  }, [location.pathname, telemetry])
  
  // 错误边界集成
  useEffect(() => {
    const originalConsoleError = console.error
    console.error = (...args) => {
      telemetry.trackError(new Error(args.join(' ')), {
        type: 'console_error'
      })
      originalConsoleError.apply(console, args)
    }
    
    return () => {
      console.error = originalConsoleError
    }
  }, [telemetry])
  
  return (
    <TelemetryContext.Provider value={telemetry}>
      {children}
    </TelemetryContext.Provider>
  )
}

export const useTelemetryContext = () => {
  const context = useContext(TelemetryContext)
  if (!context) {
    throw new Error('useTelemetryContext must be used within TelemetryProvider')
  }
  return context
}

// components/ProductCard.tsx
import React from 'react'
import { useTelemetryContext } from './TelemetryProvider'

export function ProductCard({ product }: { product: any }) {
  const { trackEvent } = useTelemetryContext()
  
  const handleAddToCart = () => {
    trackEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category
    })
    
    // 实际的添加到购物车逻辑
    addToCart(product)
  }
  
  const handleViewDetails = () => {
    trackEvent('product_view', {
      productId: product.id,
      productName: product.name,
      source: 'product_card'
    })
  }
  
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleViewDetails}>查看详情</button>
      <button onClick={handleAddToCart}>加入购物车</button>
    </div>
  )
}
```

### 3. 电商应用事件跟踪

```typescript
import { Telemetry } from '@platform/sdk-telemetry'

class ECommerceAnalytics {
  constructor() {
    Telemetry.init({
      app: 'ecommerce-web',
      release: '3.2.1',
      endpoint: 'https://analytics.shop.com/events',
      sampleRate: 0.2, // 电商场景可能需要更高的采样率
      enableAutoPageTracking: false, // 手动控制页面跟踪
      enableCrossTabDedup: true
    })
  }
  
  // 产品相关事件
  trackProductView(product: any) {
    Telemetry.trackEvent('product_view', {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      inStock: product.stock > 0,
      viewSource: this.getViewSource()
    })
  }
  
  trackAddToCart(product: any, quantity: number = 1) {
    Telemetry.trackEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      cartValue: this.getCurrentCartValue(),
      currency: 'USD'
    })
  }
  
  trackRemoveFromCart(product: any, quantity: number = 1) {
    Telemetry.trackEvent('remove_from_cart', {
      productId: product.id,
      quantity,
      remainingCartValue: this.getCurrentCartValue(),
      removalReason: 'user_action'
    })
  }
  
  // 购买流程事件
  trackCheckoutStart(cart: any) {
    Telemetry.trackEvent('checkout_start', {
      cartValue: cart.total,
      itemCount: cart.items.length,
      currency: cart.currency,
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    })
  }
  
  trackCheckoutStep(step: number, stepName: string, data?: any) {
    Telemetry.trackEvent('checkout_step', {
      step,
      stepName,
      ...data,
      timestamp: Date.now()
    })
  }
  
  trackPurchase(order: any) {
    Telemetry.trackEvent('purchase', {
      orderId: order.id,
      transactionId: order.transactionId,
      revenue: order.total,
      tax: order.tax,
      shipping: order.shipping,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price
      })),
      customerType: this.getCustomerType(),
      promotions: order.promotions
    })
  }
  
  // 搜索和发现事件
  trackSearch(query: string, results: any[] = []) {
    Telemetry.trackEvent('search', {
      query: query.toLowerCase(),
      queryLength: query.length,
      resultsCount: results.length,
      hasResults: results.length > 0,
      searchType: this.getSearchType(),
      filters: this.getCurrentFilters()
    })
  }
  
  trackFilterApplied(filterType: string, filterValue: string) {
    Telemetry.trackEvent('filter_applied', {
      filterType,
      filterValue,
      currentPage: window.location.pathname,
      previousResultsCount: this.getPreviousResultsCount(),
      newResultsCount: this.getCurrentResultsCount()
    })
  }
  
  // 用户行为事件
  trackWishlistAdd(product: any) {
    Telemetry.trackEvent('wishlist_add', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      source: this.getInteractionSource()
    })
  }
  
  trackReviewSubmit(product: any, rating: number, reviewText: string) {
    Telemetry.trackEvent('review_submit', {
      productId: product.id,
      rating,
      reviewLength: reviewText.length,
      hasPurchased: this.hasUserPurchasedProduct(product.id),
      daysSincePurchase: this.getDaysSincePurchase(product.id)
    })
  }
  
  // 营销和推广事件
  trackPromoCodeUsed(promoCode: string, discount: number) {
    Telemetry.trackEvent('promo_code_used', {
      promoCode,
      discountAmount: discount,
      cartValueBefore: this.getCartValueBeforeDiscount(),
      cartValueAfter: this.getCurrentCartValue()
    })
  }
  
  trackEmailCampaignClick(campaignId: string, emailId: string) {
    Telemetry.trackEvent('email_campaign_click', {
      campaignId,
      emailId,
      landingPage: window.location.pathname,
      userSegment: this.getUserSegment()
    })
  }
  
  // 性能监控
  trackPageLoadPerformance(pageName: string) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    Telemetry.trackEvent('page_performance', {
      pageName,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: this.getFirstPaintTime(),
      largestContentfulPaint: this.getLCPTime(),
      timeToInteractive: this.getTTITime()
    })
  }
  
  // 错误监控
  trackAPIError(endpoint: string, error: any) {
    Telemetry.trackError('api_error', error.message, {
      endpoint,
      statusCode: error.status,
      errorCode: error.code,
      userAction: this.getCurrentUserAction(),
      sessionId: this.getSessionId()
    })
  }
  
  // 辅助方法
  private getViewSource(): string {
    const referrer = document.referrer
    if (referrer.includes('search')) return 'search'
    if (referrer.includes('category')) return 'category'
    if (referrer.includes('recommendation')) return 'recommendation'
    return 'direct'
  }
  
  private getCurrentCartValue(): number {
    // 实现获取当前购物车价值的逻辑
    return 0
  }
  
  private getCustomerType(): string {
    // 实现获取客户类型的逻辑（新客户/老客户）
    return 'new'
  }
}

// 初始化电商分析
const ecommerceAnalytics = new ECommerceAnalytics()
export default ecommerceAnalytics
```

### 4. 错误监控和诊断

```typescript
import { Telemetry } from '@platform/sdk-telemetry'

class ErrorMonitoring {
  private errorCounts: Map<string, number> = new Map()
  private errorThreshold = 10 // 错误阈值
  
  constructor() {
    this.setupGlobalErrorHandling()
    this.setupPerformanceMonitoring()
    this.setupResourceErrorMonitoring()
  }
  
  private setupGlobalErrorHandling() {
    // 捕获 JavaScript 错误
    window.addEventListener('error', (event) => {
      this.handleJavaScriptError(event)
    })
    
    // 捕获 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event)
    })
    
    // 捕获 React 错误边界（如果使用 React）
    if (typeof window !== 'undefined' && (window as any).React) {
      this.setupReactErrorBoundary()
    }
  }
  
  private handleJavaScriptError(event: ErrorEvent) {
    const errorKey = `${event.filename}:${event.lineno}:${event.colno}`
    const errorCount = (this.errorCounts.get(errorKey) || 0) + 1
    this.errorCounts.set(errorKey, errorCount)
    
    Telemetry.trackError('javascript_error', event.message, {
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
      errorCount,
      isRecurring: errorCount > 1,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      
      // 环境信息
      browserInfo: this.getBrowserInfo(),
      screenInfo: this.getScreenInfo(),
      memoryInfo: this.getMemoryInfo(),
      
      // 用户行为上下文
      lastUserAction: this.getLastUserAction(),
      pageLoadTime: this.getPageLoadTime(),
      timeOnPage: this.getTimeOnPage()
    })
    
    // 错误频率监控
    if (errorCount >= this.errorThreshold) {
      this.handleHighFrequencyError(errorKey, errorCount)
    }
  }
  
  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    Telemetry.trackError('unhandled_promise_rejection', String(event.reason), {
      reason: event.reason,
      promise: event.promise,
      url: window.location.href,
      timestamp: Date.now(),
      
      // Promise 相关信息
      promiseState: 'rejected',
      handled: false,
      
      // 调试信息
      stackTrace: event.reason?.stack || 'No stack trace available',
      debugInfo: this.collectDebugInfo()
    })
  }
  
  private setupPerformanceMonitoring() {
    // 监控长任务
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // 长于 50ms 的任务
            Telemetry.trackError('long_task', `Task blocked main thread for ${entry.duration}ms`, {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
              entryType: entry.entryType,
              url: window.location.href
            })
          }
        })
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    }
    
    // 监控内存使用
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        
        if (usagePercentage > 90) { // 内存使用超过 90%
          Telemetry.trackError('high_memory_usage', `Memory usage at ${usagePercentage.toFixed(2)}%`, {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usagePercentage,
            url: window.location.href
          })
        }
      }, 30000) // 每 30 秒检查一次
    }
  }
  
  private setupResourceErrorMonitoring() {
    // 监控资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement
        Telemetry.trackError('resource_error', `Failed to load ${target.tagName}`, {
          resourceType: target.tagName.toLowerCase(),
          resourceUrl: (target as any).src || (target as any).href,
          parentElement: target.parentElement?.tagName,
          elementId: target.id,
          elementClass: target.className,
          url: window.location.href,
          timestamp: Date.now()
        })
      }
    }, true)
  }
  
  // 网络错误监控
  trackNetworkError(url: string, method: string, error: any) {
    Telemetry.trackError('network_error', error.message, {
      url,
      method,
      statusCode: error.status,
      statusText: error.statusText,
      timeout: error.timeout,
      networkType: this.getNetworkType(),
      connectionSpeed: this.getConnectionSpeed(),
      requestHeaders: error.config?.headers,
      responseHeaders: error.response?.headers,
      requestPayload: this.sanitizePayload(error.config?.data),
      retryCount: error.retryCount || 0
    })
  }
  
  // 自定义错误报告
  reportCustomError(errorType: string, message: string, context: any = {}) {
    Telemetry.trackError(errorType, message, {
      ...context,
      customError: true,
      reportedAt: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      buildInfo: this.getBuildInfo()
    })
  }
  
  // 错误恢复监控
  trackErrorRecovery(errorType: string, recoveryAction: string, success: boolean) {
    Telemetry.trackEvent('error_recovery', {
      errorType,
      recoveryAction,
      success,
      recoveryTime: Date.now(),
      attemptCount: this.getRecoveryAttemptCount(errorType)
    })
  }
  
  // 辅助方法
  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    }
  }
  
  private getScreenInfo() {
    return {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    }
  }
  
  private getMemoryInfo() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }
    return null
  }
  
  private getNetworkType() {
    return (navigator as any).connection?.effectiveType || 'unknown'
  }
  
  private handleHighFrequencyError(errorKey: string, count: number) {
    Telemetry.trackEvent('high_frequency_error', {
      errorKey,
      errorCount: count,
      threshold: this.errorThreshold,
      url: window.location.href,
      timestamp: Date.now()
    })
  }
  
  private sanitizePayload(payload: any) {
    // 移除敏感信息
    if (!payload) return null
    
    const sanitized = { ...payload }
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })
    
    return sanitized
  }
}

// 初始化错误监控
const errorMonitoring = new ErrorMonitoring()
export default errorMonitoring
```

## 🔧 配置选项

### Telemetry 配置

```typescript
interface TelemetryOptions {
  // 基础信息
  app: string                          // 应用名称
  release: string                      // 版本号
  environment?: string                 // 环境（development/staging/production）
  
  // 上报配置
  endpoint?: string                    // 上报端点
  batchSize?: number                   // 批次大小，默认 50
  flushInterval?: number               // 刷新间隔，默认 5000ms
  maxBatchEvents?: number              // 最大批次事件数，默认 200
  maxEventSize?: number                // 单个事件最大大小，默认 10KB
  
  // 采样配置
  sampleRate?: number                  // 采样率，默认 0.1
  errorSampleRate?: number             // 错误采样率，默认 1.0
  performanceSampleRate?: number       // 性能采样率，默认 0.05
  
  // 存储配置
  enableLocalStorage?: boolean         // 启用本地存储，默认 true
  maxStorageSize?: number              // 最大存储大小，默认 5MB
  storageCleanupInterval?: number      // 存储清理间隔，默认 1 小时
  
  // 功能开关
  enableBeacon?: boolean               // 启用 Beacon，默认 true
  enableCrossTabDedup?: boolean        // 启用跨标签页去重，默认 false
  enableAutoPageTracking?: boolean     // 启用自动页面跟踪，默认 false
  enableAutoErrorTracking?: boolean    // 启用自动错误跟踪，默认 false
  
  // 回调函数
  beforeSend?: (event: TelemetryEvent) => TelemetryEvent | null
  onSuccess?: (batch: TelemetryEvent[]) => void
  onError?: (error: Error, batch: TelemetryEvent[]) => void
  onStorageWarning?: (usage: number, limit: number) => void
  
  // 调试配置
  debug?: boolean                      // 调试模式，默认 false
}
```

### 事件类型

```typescript
interface TelemetryEvent {
  type: string                         // 事件类型
  timestamp: number                    // 时间戳
  data: Record<string, any>            // 事件数据
  sessionId?: string                   // 会话 ID
  userId?: string                      // 用户 ID
  metadata?: Record<string, any>       // 元数据
}

// 预定义事件类型
type TelemetryEventType = 
  | 'page_view'                        // 页面浏览
  | 'custom'                           // 自定义事件
  | 'error'                            // 错误事件
  | 'performance'                      // 性能事件
  | 'api'                              // API 事件
  | 'user_action'                      // 用户操作
```

## 🔍 类型定义

```typescript
// 用户信息
interface TelemetryUser {
  id: string
  email?: string
  name?: string
  role?: string
  [key: string]: any
}

// 存储信息
interface StorageInfo {
  used: number
  available: number
  total: number
  percentage: number
}

// 批处理器选项
interface BatcherOptions {
  maxBatchSize?: number
  flushInterval?: number
  maxWaitTime?: number
  onFlush?: (events: TelemetryEvent[]) => Promise<void>
  beforeFlush?: (events: TelemetryEvent[]) => TelemetryEvent[]
}
```

## 🚀 性能优化建议

### 1. 合理设置采样率

```typescript
// 根据环境和事件类型设置不同的采样率
Telemetry.init({
  sampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  errorSampleRate: 1.0,           // 错误事件始终收集
  performanceSampleRate: 0.01,    // 性能事件低采样率
})
```

### 2. 批量处理优化

```typescript
// 优化批处理配置
Telemetry.init({
  batchSize: 100,                 // 增大批次减少请求次数
  flushInterval: 10000,           // 延长刷新间隔
  maxBatchEvents: 500,            // 增大最大批次
})
```

### 3. 事件过滤

```typescript
// 过滤不必要的事件
Telemetry.init({
  beforeSend: (event) => {
    // 过滤调试事件
    if (event.type === 'debug' && process.env.NODE_ENV === 'production') {
      return null
    }
    
    // 过滤敏感数据
    if (event.data.password) {
      event.data.password = '[REDACTED]'
    }
    
    return event
  }
})
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
