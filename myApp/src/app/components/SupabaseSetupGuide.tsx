import { useState } from 'react';
import { CheckCircle, Circle, ExternalLink, X } from 'lucide-react';

export function SupabaseSetupGuide() {
  const [isOpen, setIsOpen] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  const appUrl = window.location.origin;

  const steps = [
    {
      id: 1,
      title: 'Open Supabase Dashboard',
      description: 'Go to https://supabase.com/dashboard and select your project',
      link: 'https://supabase.com/dashboard'
    },
    {
      id: 2,
      title: 'Navigate to URL Configuration',
      description: 'Click: Authentication → URL Configuration (in left sidebar)'
    },
    {
      id: 3,
      title: 'Add Redirect URL',
      description: `Add this URL to "Redirect URLs": ${appUrl}`
    },
    {
      id: 4,
      title: 'Also add 127.0.0.1 variant',
      description: appUrl.replace('localhost', '127.0.0.1')
    },
    {
      id: 5,
      title: 'Click Save',
      description: 'Save the configuration and wait 30 seconds'
    },
    {
      id: 6,
      title: 'Request NEW password reset',
      description: 'Old emails won\'t work - request a fresh one!'
    }
  ];

  const toggleStep = (id: number) => {
    setCheckedSteps(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const allStepsCompleted = checkedSteps.length === steps.length;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 z-50"
      >
        <span className="text-2xl">⚙️</span>
        <span className="font-semibold">Setup Guide</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border-2 border-purple-200 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          <h3 className="text-white font-bold text-lg">Supabase Setup</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {/* Your URL */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-700 font-semibold mb-1">Your App URL:</p>
          <code className="block bg-white px-2 py-1 rounded text-blue-800 font-mono text-xs">
            {appUrl}
          </code>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => {
            const isCompleted = checkedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                className={`border-2 rounded-lg p-3 transition-all cursor-pointer ${
                  isCompleted 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
                onClick={() => toggleStep(step.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <Circle className="text-gray-400" size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-semibold text-sm ${
                        isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                      }`}>
                        {step.title}
                      </h4>
                      {step.link && !isCompleted && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Message */}
        {allStepsCompleted && (
          <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="font-bold text-green-800 mb-1">All Set!</h4>
            <p className="text-sm text-green-700">
              Request a NEW password reset and click the email link. It should work now!
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-semibold">{checkedSteps.length}/{steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${(checkedSteps.length / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
