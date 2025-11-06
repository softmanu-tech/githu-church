// Ultra-fast skeleton loading components
import React from 'react';

// Ultra-fast card skeleton
export function UltraFastCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-24"></div>
    </div>
  );
}

// Ultra-fast chart skeleton
export function UltraFastChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
      <div className="h-48 bg-gray-100 rounded"></div>
    </div>
  );
}

// Ultra-fast table skeleton
export function UltraFastTableSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-4 border-b">
        <div className="h-6 bg-gray-200 rounded w-40"></div>
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ultra-fast stats skeleton
export function UltraFastStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <UltraFastCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Ultra-fast page skeleton
export function UltraFastPageSkeleton() {
  return (
    <div className="space-y-6">
      <UltraFastStatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UltraFastChartSkeleton />
        <UltraFastTableSkeleton />
      </div>
    </div>
  );
}
