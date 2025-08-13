/**
 * User Timing API 封装
 */

/**
 * 标记时间点
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
  }
}

/**
 * 测量时间间隔
 */
export function measure(name: string, startMark?: string, endMark?: string): void {
  if (typeof performance !== 'undefined' && performance.measure) {
    if (startMark && endMark) {
      performance.measure(name, startMark, endMark)
    } else if (startMark) {
      performance.measure(name, startMark)
    } else {
      performance.measure(name)
    }
  }
}

/**
 * 清除标记
 */
export function clearMarks(name?: string): void {
  if (typeof performance !== 'undefined' && performance.clearMarks) {
    performance.clearMarks(name)
  }
}

/**
 * 清除测量
 */
export function clearMeasures(name?: string): void {
  if (typeof performance !== 'undefined' && performance.clearMeasures) {
    performance.clearMeasures(name)
  }
}

/**
 * 按名称获取性能条目
 */
export function getEntriesByName(name: string, type?: string): PerformanceEntry[] {
  if (typeof performance !== 'undefined' && performance.getEntriesByName) {
    return performance.getEntriesByName(name, type)
  }
  return []
}

/**
 * 按类型获取性能条目
 */
export function getEntriesByType(type: string): PerformanceEntry[] {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    return performance.getEntriesByType(type)
  }
  return []
}