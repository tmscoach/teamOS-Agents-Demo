import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle, Shield } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          TeamOS Agents Demo
        </h1>
        <p className="text-center text-gray-600 mb-12">
          TMS (Team Management Systems) transformation platform
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/chat">
            <Button size="lg" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              Start Chat
            </Button>
          </Link>
          
          <Link href="/admin">
            <Button size="lg" variant="outline" className="gap-2">
              <Shield className="h-5 w-5" />
              Admin Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="mt-12 text-center text-sm text-gray-500">
          <p className="mb-2">Test interfaces (no auth required):</p>
          <div className="flex gap-4 justify-center">
            <Link href="/test-onboarding" className="underline hover:no-underline">
              Test Onboarding
            </Link>
            <Link href="/tms-qa" className="underline hover:no-underline">
              TMS Q&A
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}