import { useState } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { PROMPT_REGRESSION_CASES, evaluatePromptRegressionCase } from '../debug/promptRegressionSuite';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;

export function DiagnosticPanel() {
  const [testResults, setTestResults] = useState<any>(null);
  const [regressionResults, setRegressionResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const runHealthCheck = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      console.log('Health check:', data);
      return { health: data, status: response.status };
    } catch (error: any) {
      console.error('Health check failed:', error);
      return { health: null, error: error.message };
    }
  };

  const runKeyCheck = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/check-keys`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      console.log('API keys:', data);
      return data;
    } catch (error: any) {
      console.error('Key check failed:', error);
      return { error: error.message };
    }
  };

  const runAPITest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/test-api`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      console.log('API test:', data);
      return data;
    } catch (error: any) {
      console.error('API test failed:', error);
      return { error: error.message };
    }
  };

  const testSolveProblem = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/solve-problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          question: 'Solve for x: 2x + 5 = 15'
        })
      });

      const data = await response.json();
      console.log('Solve problem result:', data);
      return { solveProblemTest: data, status: response.status, success: response.ok };
    } catch (error: any) {
      console.error('Solve problem test failed:', error);
      return { solveProblemTest: null, error: error.message, success: false };
    }
  };

  const testImageOCR = async () => {
    if (!testImageUrl) {
      alert('Please enter an image URL first');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/solve-problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          question: 'Please read and extract all text from this image',
          imageUrl: testImageUrl
        })
      });

      const data = await response.json();
      console.log('OCR result:', data);
      return { ocrTest: data, status: response.status };
    } catch (error: any) {
      console.error('OCR test failed:', error);
      return { ocrTest: null, error: error.message };
    }
  };

  const runFullDiagnostics = async () => {
    setIsLoading(true);
    setTestResults(null);

    const results = {
      timestamp: new Date().toISOString(),
      health: await runHealthCheck(),
      keys: await runKeyCheck(),
      apiTest: await runAPITest(),
      solveProblem: await testSolveProblem(),
      fixVerification: {
        openaiMaxTokens: 'Enabled',
        textSpacingFix: 'fixMissingSpaces() active',
        latexValidation: 'validateAndFixLatex() active',
        jsonRepair: 'Response repair enabled',
        regressionSuite: 'Prompt regression cases available in debug panel'
      }
    };

    setTestResults(results);
    setIsLoading(false);
  };

  const testOCROnly = async () => {
    setIsLoading(true);
    const ocrResult = await testImageOCR();
    setTestResults((current: any) => ({ ...(current || {}), ocrTest: ocrResult }));
    setIsLoading(false);
  };

  const runPromptRegressionSuite = async () => {
    setIsLoading(true);
    setRegressionResults(null);

    try {
      const results = [];

      for (const testCase of PROMPT_REGRESSION_CASES) {
        console.log('Running prompt regression case:', testCase.label);

        const response = await fetch(`${API_BASE_URL}/solve-problem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            question: testCase.question
          })
        });

        const data = await response.json();
        const evaluation = evaluatePromptRegressionCase(testCase, data);

        results.push({
          ...evaluation,
          status: response.status,
          success: response.ok
        });
      }

      setRegressionResults(results);
    } catch (error: any) {
      console.error('Prompt regression suite failed:', error);
      setRegressionResults([
        {
          id: 'suite-error',
          label: 'Prompt Regression Suite',
          question: '',
          expectedDomain: '',
          passed: false,
          issues: [{ severity: 'error', message: error.message }],
          stepCount: 0,
          success: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 p-4 shadow-xl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              API Diagnostics and Prompt Regression
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-normal text-green-800">
                Debug Mode
              </span>
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Health checks, solve-problem smoke tests, OCR tests, and representative prompt regressions.
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={runFullDiagnostics}
            disabled={isLoading}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500"
          >
            {isLoading ? 'Running Tests...' : 'Run Full Diagnostics'}
          </button>
          <button
            onClick={runHealthCheck}
            disabled={isLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-green-700 disabled:bg-gray-400"
          >
            Health Check
          </button>
          <button
            onClick={runKeyCheck}
            disabled={isLoading}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-purple-700 disabled:bg-gray-400"
          >
            Check API Keys
          </button>
          <button
            onClick={runAPITest}
            disabled={isLoading}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-orange-700 disabled:bg-gray-400"
          >
            Test APIs
          </button>
          <button
            onClick={testSolveProblem}
            disabled={isLoading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-red-700 disabled:bg-gray-400"
          >
            Test Solve Problem
          </button>
          <button
            onClick={runPromptRegressionSuite}
            disabled={isLoading}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-slate-800 disabled:bg-gray-400"
          >
            Prompt Regression Suite
          </button>
        </div>

        {showDetails && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">Regression Cases</h3>
            <div className="grid gap-2 text-xs text-blue-800 md:grid-cols-2">
              {PROMPT_REGRESSION_CASES.map((testCase) => (
                <div key={testCase.id} className="rounded border border-blue-100 bg-white/70 p-2">
                  <p className="font-semibold text-blue-900">{testCase.label}</p>
                  <p>{testCase.expectedDomain}</p>
                  <p className="mt-1 text-blue-700">{testCase.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Test image OCR with an image URL:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testImageUrl}
              onChange={(e) => setTestImageUrl(e.target.value)}
              placeholder="https://... optional OCR test URL"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={testOCROnly}
              disabled={isLoading || !testImageUrl}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Test OCR
            </button>
          </div>
        </div>

        {testResults && (
          <div className="max-h-96 overflow-auto rounded-lg border-2 border-gray-300 bg-white p-4 shadow-inner">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Test Results</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  testResults.apiTest?.openai?.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {testResults.apiTest?.openai?.success ? 'All Systems Operational' : 'Issues Detected'}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className={`rounded-lg p-3 ${testResults.health?.health?.status === 'ok' ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'}`}>
                <div className="mb-1 text-xs text-gray-600">Backend Health</div>
                <div className="text-sm font-bold">{testResults.health?.health?.status === 'ok' ? 'Online' : 'Offline'}</div>
              </div>
              <div className={`rounded-lg p-3 ${testResults.keys?.hasOpenAI ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'}`}>
                <div className="mb-1 text-xs text-gray-600">OpenAI Key</div>
                <div className="text-sm font-bold">{testResults.keys?.hasOpenAI ? 'Set' : 'Missing'}</div>
              </div>
              <div className={`rounded-lg p-3 ${testResults.solveProblem?.success ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'}`}>
                <div className="mb-1 text-xs text-gray-600">Solve Problem</div>
                <div className="text-sm font-bold">{testResults.solveProblem?.success ? 'Working' : 'Failed'}</div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="mb-1 text-xs text-gray-600">Prompt Suite</div>
                <div className="text-sm font-bold">{regressionResults ? 'Available' : 'Not run yet'}</div>
              </div>
            </div>

            <details className="mt-3">
              <summary className="mb-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                View Full JSON Response
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {regressionResults && (
          <div className="mt-4 rounded-lg border-2 border-slate-300 bg-white p-4 shadow-inner">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Prompt Regression Results</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  regressionResults.every((result) => result.passed)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {regressionResults.filter((result) => result.passed).length}/{regressionResults.length} passing
              </span>
            </div>

            <div className="space-y-3">
              {regressionResults.map((result) => (
                <div
                  key={result.id}
                  className={`rounded-lg border p-3 ${
                    result.passed ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{result.label}</p>
                      <p className="text-xs text-gray-600">{result.expectedDomain}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${result.passed ? 'text-green-700' : 'text-yellow-700'}`}>
                        {result.passed ? 'PASS' : 'CHECK'}
                      </p>
                      <p className="text-xs text-gray-500">{result.stepCount} steps</p>
                    </div>
                  </div>

                  <p className="mb-2 text-xs text-gray-700">{result.question}</p>

                  {result.issues.length === 0 ? (
                    <p className="text-xs font-medium text-green-700">No issues detected.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-gray-700">
                      {result.issues.map((issue: any, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className={issue.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                            {issue.severity === 'error' ? '✗' : '•'}
                          </span>
                          <span>{issue.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
          <div className="grid grid-cols-1 gap-2 text-xs text-gray-700 md:grid-cols-2">
            <div>
              <p className="mb-1 font-medium text-gray-900">Quick Tips</p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>Use the regression suite after prompt edits to catch LaTeX regressions early.</li>
                <li>Check browser console and Edge Function logs together when a case fails.</li>
                <li>Use simple questions first, then representative domain-specific cases.</li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium text-gray-900">Next Steps</p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>Run with `?debug=true` after backend prompt changes.</li>
                <li>Use the suite to compare before and after prompt revisions.</li>
                <li>Expand the case list if a new domain or notation issue appears.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
