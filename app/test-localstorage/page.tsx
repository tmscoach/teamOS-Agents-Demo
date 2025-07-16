"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const CONVERSATION_STORAGE_KEY = 'teamOS_activeConversationId';

export default function TestLocalStorage() {
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [testValue, setTestValue] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLog(prev => [...prev, `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    // Check initial value
    const initial = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    setStoredValue(initial);
    addLog(`Initial value: ${initial || 'null'}`);

    // Set up storage event listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONVERSATION_STORAGE_KEY) {
        addLog(`Storage event: ${e.oldValue} -> ${e.newValue}`);
        setStoredValue(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setTestValueInStorage = () => {
    const value = testValue || `test-${Date.now()}`;
    localStorage.setItem(CONVERSATION_STORAGE_KEY, value);
    setStoredValue(value);
    addLog(`Set value: ${value}`);
    setTestValue('');
  };

  const clearStorage = () => {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    setStoredValue(null);
    addLog('Cleared storage');
  };

  const checkActualConversations = async () => {
    try {
      const response = await fetch('/api/agents/chat-simple');
      const data = await response.json();
      addLog(`API Response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`API Error: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">LocalStorage Debug Tool</h1>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Current Storage Value</h2>
        <p className="font-mono bg-gray-100 p-2 rounded">
          {CONVERSATION_STORAGE_KEY}: {storedValue || 'null'}
        </p>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            placeholder="Enter test value or leave empty for auto"
            className="flex-1 px-3 py-2 border rounded"
          />
          <Button onClick={setTestValueInStorage}>Set Value</Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={clearStorage} variant="destructive">Clear Storage</Button>
          <Button onClick={checkActualConversations} variant="outline">Check API</Button>
          <Button onClick={() => window.location.reload()} variant="outline">Reload Page</Button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Activity Log</h2>
        <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {log.map((entry, index) => (
            <div key={index} className="mb-1">{entry}</div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Debug Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check the current stored conversation ID</li>
          <li>Try setting a test value and reload the page</li>
          <li>Open the chat in another tab and see if the conversation ID appears here</li>
          <li>Check browser developer tools localStorage</li>
        </ol>
      </div>
    </div>
  );
}