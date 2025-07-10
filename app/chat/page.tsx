"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ChatClient from "./ChatClient";

function ChatPageLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatClient />
    </Suspense>
  );
}