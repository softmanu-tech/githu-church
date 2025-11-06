import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-2 sm:p-3 md:p-4 lg:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8" />
        </div>
        <div className="ml-1 sm:ml-2 md:ml-3 lg:ml-4">
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-6 w-8" />
        </div>
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="bg-blue-200/90 backdrop-blur-md border border-blue-300 rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-8 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton, CardSkeleton, ChartSkeleton, TableSkeleton }