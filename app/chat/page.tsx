"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function ChatPageLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function ChatPage() {
  const [ChatClient, setChatClient] = useState<any>(null);

  useEffect(() => {
    // Check streaming flag at runtime - default to optimized version
    const useOptimized = process.env.NEXT_PUBLIC_USE_OPTIMIZED !== 'false';
    console.log('[ChatPage] Using optimized client:', useOptimized);
    
    if (useOptimized) {
      import("./ChatClientOptimized").then((module) => {
        console.log('[ChatPage] Loaded optimized streaming client');
        setChatClient(() => module.default);
      });
    } else {
      import("./ChatClient").then((module) => {
        console.log('[ChatPage] Loaded standard client');
        setChatClient(() => module.default);
      });
    }
  }, []);

  if (!ChatClient) {
    return <ChatPageLoading />;
  }

  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatClient />
    </Suspense>
  );
}