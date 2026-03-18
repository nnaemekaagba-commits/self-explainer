import { useState } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export function CalculationDiagnostic() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const testQuestion = "A 60kg person stands on a table with 4 legs. Find the normal force on each leg.";
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e/test-calculations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ question: testQuestion })
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-xl p-4 max-w-md border-2 border-blue-500">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">🧪 Calculation Test</h3>
        <button
          onClick={runTest}
          disabled={testing}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run Test'}
        </button>
      </div>

      {result && (
        <div className="mt-3 text-xs space-y-2">
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700">
              Error: {result.error}
            </div>
          ) : (
            <>
              <div className={`p-2 rounded border ${
                result.analysis?.verdict?.includes('✅') 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="font-bold mb-1">{result.analysis?.verdict}</div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-2">
                <div className="font-semibold mb-1">AI Response:</div>
                <div className="text-gray-700 max-h-32 overflow-y-auto">
                  {result.aiResponse}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium">Has Numbers:</div>
                  <div>{result.analysis?.hasNumbers ? '✅' : '❌'}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium">Has Equals:</div>
                  <div>{result.analysis?.hasEquals ? '✅' : '❌'}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium">Has Calc:</div>
                  <div>{result.analysis?.hasParenthCalc ? '✅' : '❌'}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium">Length:</div>
                  <div>{result.analysis?.descriptionLength}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        This sends a direct test to OpenAI to check if it's doing calculations.
      </div>
    </div>
  );
}
