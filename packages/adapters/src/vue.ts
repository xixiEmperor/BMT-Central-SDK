/**
 * Vue Query 适配器
 */

import type { BaseQueryOptions } from './types.js'

export interface VueQueryDefaults {
  /** 默认查询选项 */
  defaultOptions: {
    queries: BaseQueryOptions
    mutations: Record<string, unknown>
  }
  /** 创建 Vue Query 客户端 */
  createQueryClient(): unknown  // VueQueryClient 类型来自 @tanstack/vue-query
}

/**
 * 创建 Vue Query 默认配置
 */
export function createVueQueryDefaults(): VueQueryDefaults {
  return {
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000, // 5分钟
        cacheTime: 10 * 60 * 1000, // 10分钟
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true
      },
      mutations: {
        retry: 1,
        retryDelay: 1000
      }
    },
    createQueryClient() {
      // 返回一个基本的查询客户端配置
      // 实际使用时需要安装 @tanstack/vue-query
      return {
        defaultOptions: this.defaultOptions
      }
    }
  }
}

/**
 * Vue 全局错误处理器
 */
export function createGlobalErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    console.error('[Vue Global Error]:', error)
    
    // 可以在这里集成遥测上报
    try {
      // 动态导入telemetry模块
      import('@platform/sdk-telemetry').then(({ Telemetry, createErrorEvent }) => {
        if (Telemetry.isInitialized()) {
          const event = createErrorEvent(error, {
            context: 'vue_global_error',
            component: 'unknown'
          })
          Telemetry.track(event)
        }
      }).catch(() => {
        // Telemetry模块不可用，忽略
      })
    } catch {
      // 忽略遥测错误
    }
  }
}

/**
 * Vue 路由埋点插件
 */
export function createRouterPlugin(): unknown {
  return {
    install(app: any) {
      // Vue Router 插件实现
      const router = app.config.globalProperties.$router
      
      if (router) {
        router.beforeEach((to: any, from: any, next: any) => {
          // 页面浏览埋点
          try {
            import('@platform/sdk-telemetry').then(({ Telemetry, createPageEvent }) => {
              if (Telemetry.isInitialized()) {
                const event = createPageEvent(to.path, {
                  title: to.meta?.title || document.title,
                  from: from.path,
                  query: to.query
                })
                Telemetry.track(event)
              }
            }).catch(() => {
              // Telemetry模块不可用，忽略
            })
          } catch {
            // 忽略遥测错误
          }
          
          next()
        })
      }
    }
  }
}