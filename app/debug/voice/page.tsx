'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

export default function VoiceDebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };
  
  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // 1. Check browser support
      addResult('=== 1. Browser Support ===');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addResult('❌ getUserMedia not supported');
      } else {
        addResult('✅ getUserMedia supported');
      }
      
      if (!('AudioContext' in window || 'webkitAudioContext' in window)) {
        addResult('❌ AudioContext not supported');
      } else {
        addResult('✅ AudioContext supported');
      }
      
      if (!('WebSocket' in window)) {
        addResult('❌ WebSocket not supported');
      } else {
        addResult('✅ WebSocket supported');
      }
      
      // 2. Check microphone permissions
      addResult('\\n=== 2. Microphone Permissions ===');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        addResult('✅ Microphone access granted');
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        addResult(`❌ Microphone access denied: ${err.message}`);
      }
      
      // 3. Test API session creation
      addResult('\\n=== 3. API Session Creation ===');
      try {
        const response = await fetch('/api/voice/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowState: {} }),
        });
        
        if (response.ok) {
          const data = await response.json();
          addResult('✅ Session created successfully');
          addResult(`Session ID: ${data.session.id}`);
          addResult(`Token: ${data.session.token?.substring(0, 20)}...`);
          
          // 4. Test WebSocket connection
          addResult('\\n=== 4. WebSocket Connection ===');
          const wsUrl = 'wss://api.openai.com/v1/realtime';
          addResult(`Connecting to: ${wsUrl}`);
          
          const ws = new WebSocket(wsUrl, [
            'realtime',
            `openai-insecure-api-key.${data.session.token}`,
            'openai-beta.realtime-v1'
          ]);
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              addResult('❌ WebSocket connection timeout');
              ws.close();
              reject(new Error('Timeout'));
            }, 10000);
            
            ws.onopen = () => {
              addResult('✅ WebSocket connected');
              clearTimeout(timeout);
              
              // Send session update
              ws.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ['audio', 'text'],
                  voice: 'alloy',
                }
              }));
            };
            
            ws.onmessage = (event) => {
              const message = JSON.parse(event.data);
              addResult(`Message received: ${message.type}`);
              if (message.type === 'session.updated') {
                resolve();
              }
            };
            
            ws.onerror = (error) => {
              addResult(`❌ WebSocket error: ${error}`);
              clearTimeout(timeout);
              reject(error);
            };
            
            ws.onclose = (event) => {
              addResult(`WebSocket closed: ${event.code} ${event.reason}`);
              clearTimeout(timeout);
            };
          });
          
          ws.close();
          
        } else {
          addResult(`❌ Session creation failed: ${response.status}`);
        }
      } catch (err: any) {
        addResult(`❌ API error: ${err.message}`);
      }
      
      // 5. Check for blocking issues
      addResult('\\n=== 5. Common Blocking Issues ===');
      
      // Check if we're on HTTPS or localhost
      if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        addResult('✅ Secure context (HTTPS/localhost)');
      } else {
        addResult('❌ Not a secure context - microphone may not work');
      }
      
      // Check for content security policy
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (csp) {
        addResult(`⚠️ CSP found: ${csp.getAttribute('content')}`);
      } else {
        addResult('✅ No restrictive CSP found');
      }
      
      addResult('\\n=== Diagnosis Complete ===');
      
    } catch (err: any) {
      addResult(`\\n❌ Diagnostic error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Voice Feature Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
          >
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          
          {results.length > 0 && (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              {results.map((result, i) => (
                <div key={i} className="whitespace-pre-wrap">{result}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}