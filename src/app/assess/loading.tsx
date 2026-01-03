export default function AssessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-12">
        {/* Progress bar skeleton */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gray-300 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Title skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-200 rounded-lg w-2/3 mx-auto mb-4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse" />
        </div>

        {/* Card skeleton */}
        <div className="relative h-96 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
              {/* Card content skeleton */}
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex justify-center gap-4 mt-8">
          <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
