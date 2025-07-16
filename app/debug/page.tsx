"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const CONVERSATION_STORAGE_KEY = 'teamOS-current-conversation';

export default function DebugPage() {
  const [storedId, setStoredId] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const id = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    setStoredId(id);
  }, []);
  
  const clearStorage = () => {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    setStoredId(null);
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Chat Storage</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Stored Conversation ID:</strong>
          <pre className="bg-gray-100 p-2 rounded mt-2">
            {storedId || 'No conversation stored'}
          </pre>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={() => router.push('/chat')}>
            Continue Chat (go to /chat)
          </Button>
          
          <Button onClick={() => router.push('/chat?new=true')}>
            New Chat (go to /chat?new=true)
          </Button>
          
          <Button onClick={clearStorage} variant="destructive">
            Clear Storage
          </Button>
          
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}