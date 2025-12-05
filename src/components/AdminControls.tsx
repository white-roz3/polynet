'use client';

import { useState } from 'react';

export default function AdminControls() {
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [syncStats, setSyncStats] = useState<any>(null);
  
  const runCron = async (endpoint: string, name: string) => {
    setRunning(endpoint);
    setMessage('');
    try {
      const response = await fetch(`/api/cron/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || process.env.CRON_SECRET || ''}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const details = endpoint === 'sync-markets'
          ? `Added ${data.sync?.added || 0}, Updated ${data.sync?.updated || 0}`
          : endpoint === 'run-agents' 
          ? `Made ${data.predictions || 0} predictions` 
          : endpoint === 'resolve-markets'
          ? `Resolved ${data.resolved || 0} markets`
          : `Bankrupted ${data.bankrupted || 0} agents`;
        setMessage(`✓ ${name.toUpperCase()} COMPLETED: ${details}`);
        
        if (data.sync) {
          setSyncStats(data.sync);
        }
      } else {
        setMessage(`✗ ${name.toUpperCase()} FAILED: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setMessage(`✗ ERROR: ${error.message}`);
    } finally {
      setRunning(null);
      setTimeout(() => setMessage(''), 8000);
    }
  };
  
  return (
    <div className="kalshinet-card p-4 mb-6 border-[#fbbf24]/30">
      <div className="text-[#fbbf24] font-semibold mb-4 text-sm uppercase tracking-wider">
        ▶ Admin Controls
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => runCron('sync-markets', 'Market Sync')}
          disabled={running === 'sync-markets'}
          className="w-full kalshinet-card px-4 py-3 font-semibold text-sm text-white hover:bg-[#1e2235] disabled:opacity-50 transition-colors"
        >
          {running === 'sync-markets' ? '⟲ SYNCING...' : '▣ SYNC_MARKETS'}
        </button>
        
        <button
          onClick={() => runCron('run-agents', 'Agent Analysis')}
          disabled={running === 'run-agents'}
          className="w-full kalshinet-card px-4 py-3 font-semibold text-sm text-white hover:bg-[#1e2235] disabled:opacity-50 transition-colors"
        >
          {running === 'run-agents' ? '⟲ RUNNING...' : '◎ RUN_AGENT_ANALYSIS'}
        </button>
        
        <button
          onClick={() => runCron('resolve-markets', 'Market Resolution')}
          disabled={running === 'resolve-markets'}
          className="w-full kalshinet-card px-4 py-3 font-semibold text-sm text-white hover:bg-[#1e2235] disabled:opacity-50 transition-colors"
        >
          {running === 'resolve-markets' ? '⟲ RUNNING...' : '◆ RESOLVE_MARKETS'}
        </button>
        
        <button
          onClick={() => runCron('check-bankruptcies', 'Bankruptcy Check')}
          disabled={running === 'check-bankruptcies'}
          className="w-full kalshinet-card px-4 py-3 font-semibold text-sm text-white hover:bg-[#1e2235] disabled:opacity-50 transition-colors"
        >
          {running === 'check-bankruptcies' ? '⟲ RUNNING...' : '✕ CHECK_BANKRUPTCIES'}
        </button>
      </div>
      
      {message && (
        <div className={`text-xs p-3 kalshinet-card mt-3 ${
          message.includes('✓') ? 'border-[#00C853]/50 bg-[#00C853]/10 text-[#00C853]' : 'border-red-500/50 bg-red-500/10 text-red-400'
        }`}>
          {message}
        </div>
      )}
      
      {syncStats && (
        <div className="mt-3 p-3 kalshinet-card text-xs">
          <div className="font-semibold mb-2 text-white">LAST SYNC RESULTS:</div>
          <div className="space-y-1 text-gray-400">
            <div className="text-[#00C853]">✓ ADDED: {syncStats.added}</div>
            <div className="text-blue-400">⟲ UPDATED: {syncStats.updated}</div>
            <div className="text-gray-500">⊳ SKIPPED: {syncStats.skipped}</div>
            {syncStats.errors > 0 && <div className="text-red-400">✗ ERRORS: {syncStats.errors}</div>}
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4 leading-relaxed space-y-1">
        <div>▶ Markets sync every 12h</div>
        <div>▶ Agents analyze every 6h</div>
        <div>▶ Markets resolve every 4h</div>
        <div>▶ Bankruptcies check every 1h</div>
      </div>
    </div>
  );
}
