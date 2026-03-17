export function TinyFlippingBook() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative w-6 h-8">
        {/* Animated flipping pages */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Page 1 */}
          <div className="absolute w-5 h-7 bg-white rounded-r shadow animate-flip-page-1" style={{ transformOrigin: 'left center' }}>
            <div className="w-full h-full bg-gradient-to-br from-blue-200 to-blue-300 rounded-r p-0.5">
              <div className="space-y-0.5">
                <div className="h-px bg-blue-500 rounded w-3/4"></div>
                <div className="h-px bg-blue-500 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Page 2 */}
          <div className="absolute w-5 h-7 bg-white rounded-r shadow animate-flip-page-2" style={{ transformOrigin: 'left center' }}>
            <div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-300 rounded-r p-0.5">
              <div className="space-y-0.5">
                <div className="h-px bg-purple-500 rounded w-2/3"></div>
                <div className="h-px bg-purple-500 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Book spine/base */}
          <div className="absolute w-5 h-7 bg-gradient-to-br from-gray-600 to-gray-700 rounded-r shadow-md -z-10">
            <div className="h-full w-px bg-gray-800"></div>
          </div>
        </div>
      </div>
      <span className="text-[11px] text-gray-500">Processing...</span>
    </div>
  );
}
