export function FlippingBookLoader() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative">
        {/* Book container */}
        <div className="relative w-32 h-40">
          {/* Animated flipping pages */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Page 1 */}
            <div className="absolute w-24 h-32 bg-white rounded-r-lg shadow-xl animate-flip-page-1" style={{ transformOrigin: 'left center' }}>
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-r-lg p-2">
                <div className="space-y-1">
                  <div className="h-1 bg-blue-400 rounded w-3/4"></div>
                  <div className="h-1 bg-blue-400 rounded w-full"></div>
                  <div className="h-1 bg-blue-400 rounded w-2/3"></div>
                </div>
              </div>
            </div>

            {/* Page 2 */}
            <div className="absolute w-24 h-32 bg-white rounded-r-lg shadow-xl animate-flip-page-2" style={{ transformOrigin: 'left center' }}>
              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 rounded-r-lg p-2">
                <div className="space-y-1">
                  <div className="h-1 bg-purple-400 rounded w-2/3"></div>
                  <div className="h-1 bg-purple-400 rounded w-full"></div>
                  <div className="h-1 bg-purple-400 rounded w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Page 3 */}
            <div className="absolute w-24 h-32 bg-white rounded-r-lg shadow-xl animate-flip-page-3" style={{ transformOrigin: 'left center' }}>
              <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 rounded-r-lg p-2">
                <div className="space-y-1">
                  <div className="h-1 bg-pink-400 rounded w-full"></div>
                  <div className="h-1 bg-pink-400 rounded w-2/3"></div>
                  <div className="h-1 bg-pink-400 rounded w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Book spine/base */}
            <div className="absolute w-24 h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-r-lg shadow-2xl -z-10">
              <div className="h-full w-1 bg-gray-900 rounded-l"></div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <p className="text-white text-center mt-6 text-[14px] font-medium animate-pulse">
          Processing...
        </p>
      </div>
    </div>
  );
}
