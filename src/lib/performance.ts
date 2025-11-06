// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    this.metrics.set(label, performance.now());
  }

  endTimer(label: string): number {
    const startTime = this.metrics.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.delete(label);
      return duration;
    }
    return 0;
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  getMetrics(): { cacheHitRate: number; cacheHits: number; cacheMisses: number } {
    return {
      cacheHitRate: this.getCacheHitRate(),
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses
    };
  }

  reset(): void {
    this.metrics.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// API performance decorator
export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  label: string
) {
  return async (...args: T): Promise<R> => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.startTimer(label);
    
    try {
      const result = await fn(...args);
      const duration = monitor.endTimer(label);
      console.log(`⚡ ${label} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      monitor.endTimer(label);
      throw error;
    }
  };
}

// Cache performance decorator
export function withCacheMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheKey: string,
  cache: Map<string, { data: R; timestamp: number; ttl: number }>,
  ttl: number
) {
  return async (...args: T): Promise<R> => {
    const monitor = PerformanceMonitor.getInstance();
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      monitor.recordCacheHit();
      console.log(`🎯 Cache hit for ${cacheKey}`);
      return cached.data;
    }
    
    monitor.recordCacheMiss();
    console.log(`🔄 Cache miss for ${cacheKey}, fetching data...`);
    
    const result = await fn(...args);
    
    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl
    });
    
    return result;
  };
}
