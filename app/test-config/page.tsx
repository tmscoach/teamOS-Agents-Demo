"use client";

import { useAuth } from "@clerk/nextjs";

export default function TestConfigPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configuration Test</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Environment Variables (Client-side)</h2>
          <ul className="space-y-1 text-sm font-mono">
            <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set'}</li>
            <li>NEXT_PUBLIC_CLERK_SIGN_IN_URL: {process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'Not set (using default)'}</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Clerk Status</h2>
          <ul className="space-y-1 text-sm">
            <li>Clerk Loaded: {isLoaded ? '✅ Yes' : '❌ No'}</li>
            <li>User Signed In: {isSignedIn ? '✅ Yes' : '❌ No'}</li>
            <li>User ID: {userId || 'None'}</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Test Links</h2>
          <ul className="space-y-2">
            <li>
              <a href="/sign-in" className="text-blue-600 hover:underline">
                Go to Sign-In Page →
              </a>
            </li>
            <li>
              <a href="/test-chat.html" className="text-blue-600 hover:underline">
                Test Chat (No Auth Required) →
              </a>
            </li>
            <li>
              <a href="/admin-test" className="text-blue-600 hover:underline">
                Admin Dashboard Mock →
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-sm">
            <strong>Note:</strong> If Clerk is not loading, make sure:
          </p>
          <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
            <li>Your .env.local file contains the Clerk keys</li>
            <li>You've restarted the dev server after adding keys</li>
            <li>The keys are valid and from your Clerk dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}