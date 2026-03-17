import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;

export function APIStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'warning' | 'error'>('checking');
  const [details, setDetails] = useState<string>('Checking API status...');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    try {
      // Check health
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (!healthResponse.ok) {
        setStatus('error');
        setDetails('Backend not responding');
        return;
      }

      // Check API keys
      const keysResponse = await fetch(`${API_BASE_URL}/check-keys`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (!keysResponse.ok) {
        setStatus('error');
        setDetails('Cannot check API keys');
        return;
      }

      const keysData = await keysResponse.json();

      if (!keysData.hasOpenAI) {
        setStatus('error');
        setDetails('OpenAI API key not configured');
      } else {
        setStatus('ok');
        setDetails('OpenAI ready');
      }
    } catch (error) {
      setStatus('error');
      setDetails('Backend unreachable');
    }
  };

  const statusColors = {
    checking: 'bg-gray-400',
    ok: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const statusIcons = {
    checking: '⏳',
    ok: '✓',
    warning: '⚠',
    error: '✗'
  };

  return (
    <div 
      className="fixed bottom-20 right-4 z-40"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className={`${statusColors[status]} text-white px-3 py-2 rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium`}>
        <span className="text-base">{statusIcons[status]}</span>
        {isExpanded ? (
          <span className="whitespace-nowrap">{details}</span>
        ) : (
          <span>API</span>
        )}
      </div>
    </div>
  );
}
