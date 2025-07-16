"use client"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function TestSignUpPage() {
  const { isLoaded, signUp } = useSignUp()
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  const testSignUp = async () => {
    if (!signUp) return
    
    setError(null)
    setResult(null)
    
    try {
      // Step 1: Create sign-up
      const createResult = await signUp.create({
        emailAddress: email,
      })
      setResult({ step: "create", data: createResult })
      
      // Step 2: Prepare verification
      const verifyResult = await signUp.prepareEmailAddressVerification({
        strategy: "email_code"
      })
      setResult({ step: "verify", data: verifyResult })
      
    } catch (err: any) {
      setError({
        message: err.message,
        errors: err.errors,
        status: err.status,
        clerkError: err.clerkError,
        // Log everything for debugging
        full: JSON.stringify(err, null, 2)
      })
    }
  }

  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Clerk Sign-Up Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="test@example.com"
          />
        </div>
        
        <Button onClick={testSignUp}>Test Sign-Up</Button>
      </div>

      {result && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="font-bold text-green-800 mb-2">Success - Step: {result.step}</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="font-bold text-red-800 mb-2">Error Details</h2>
          <div className="space-y-2">
            <p><strong>Message:</strong> {error.message}</p>
            <p><strong>Status:</strong> {error.status}</p>
            <p><strong>Clerk Error:</strong> {error.clerkError ? 'true' : 'false'}</p>
            {error.errors && (
              <div>
                <strong>Errors:</strong>
                <pre className="text-xs overflow-auto mt-1">{JSON.stringify(error.errors, null, 2)}</pre>
              </div>
            )}
            <details>
              <summary className="cursor-pointer font-bold">Full Error Object</summary>
              <pre className="text-xs overflow-auto mt-2">{error.full}</pre>
            </details>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-bold mb-2">Debug Info</h3>
        <p>SignUp loaded: {isLoaded ? 'Yes' : 'No'}</p>
        <p>SignUp object exists: {signUp ? 'Yes' : 'No'}</p>
        {signUp && (
          <details>
            <summary className="cursor-pointer">SignUp Status</summary>
            <pre className="text-xs overflow-auto mt-2">{JSON.stringify({
              status: signUp.status,
              emailAddress: signUp.emailAddress,
              username: signUp.username,
              firstName: signUp.firstName,
              lastName: signUp.lastName,
              unsafeMetadata: signUp.unsafeMetadata,
            }, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  )
}