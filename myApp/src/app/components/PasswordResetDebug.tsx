import { useState } from 'react';

/**
 * Password Reset Debug Component
 * 
 * Shows current URL info to help debug password reset detection
 * Only render this when you need to debug - not for production!
 */
export function PasswordResetDebug() {
  const [showDebug, setShowDebug] = useState(false);
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  const debugInfo = {
    fullUrl: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    urlParams: Object.fromEntries(urlParams.entries()),
    hashParams: Object.fromEntries(hashParams.entries()),
    hasAccessToken: hashParams.has('access_token'),
    tokenType: hashParams.get('type'),
    isPasswordReset: hashParams.get('type') === 'recovery',
  };

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-yellow-600 z-50"
      >
        🔍 Show URL Debug Info
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-yellow-500 rounded-lg shadow-2xl p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-yellow-700">🔍 Password Reset Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700 font-bold"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* Status Indicator */}
        <div className={`p-2 rounded ${debugInfo.isPasswordReset ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'}`}>
          <p className="font-bold mb-1">
            {debugInfo.isPasswordReset ? '✅ PASSWORD RESET DETECTED' : '❌ Not a password reset'}
          </p>
          <p className="text-gray-700">
            Type: <code className="bg-white px-1 py-0.5 rounded">{debugInfo.tokenType || 'null'}</code>
          </p>
        </div>

        {/* Full URL */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Full URL:</p>
          <code className="block bg-gray-50 p-2 rounded text-[10px] break-all">
            {debugInfo.fullUrl}
          </code>
        </div>

        {/* URL Search Params */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">URL Params (?...):</p>
          <pre className="bg-gray-50 p-2 rounded text-[10px] overflow-auto">
            {JSON.stringify(debugInfo.urlParams, null, 2)}
          </pre>
        </div>

        {/* Hash Params */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Hash Params (#...):</p>
          <pre className="bg-gray-50 p-2 rounded text-[10px] overflow-auto">
            {JSON.stringify(debugInfo.hashParams, null, 2)}
          </pre>
        </div>

        {/* Detection Checks */}
        <div>
          <p className="font-semibold text-gray-700 mb-1">Detection Checks:</p>
          <ul className="space-y-1">
            <li className="flex items-center gap-2">
              <span>{debugInfo.hasAccessToken ? '✅' : '❌'}</span>
              <span>Has access_token in hash</span>
            </li>
            <li className="flex items-center gap-2">
              <span>{debugInfo.tokenType === 'recovery' ? '✅' : '❌'}</span>
              <span>Type is 'recovery'</span>
            </li>
            <li className="flex items-center gap-2">
              <span>{debugInfo.isPasswordReset ? '✅' : '❌'}</span>
              <span>Should show reset screen</span>
            </li>
          </ul>
        </div>

        {/* Instructions */}
        <div className="border-t pt-2">
          <p className="text-gray-600 text-[10px] leading-relaxed">
            <strong>How to test:</strong><br/>
            1. Request password reset<br/>
            2. Click link in email<br/>
            3. Check if "PASSWORD RESET DETECTED" shows green<br/>
            4. Verify type = 'recovery'<br/>
            5. Screen should show 🔑 "Set New Password"
          </p>
        </div>
      </div>
    </div>
  );
}
