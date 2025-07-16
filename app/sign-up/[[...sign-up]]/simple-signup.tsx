"use client"

import { useState, useEffect } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function SimpleSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  if (!isLoaded) {
    return null
  }

  // Handle the initial sign-up form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // Create the sign-up with email and password (password might be required)
      await signUp.create({
        emailAddress: email,
        password: password || "TemporaryPassword123!" // Provide a default if not using passwords
      })

      // Send the verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      
      // Set pending verification
      setPendingVerification(true)
    } catch (err: any) {
      console.error("Sign-up error:", JSON.stringify(err, null, 2))
      setError(err.errors?.[0]?.message || "An error occurred during sign-up")
    }
  }

  // Handle verification code submission
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push("/chat?agent=OnboardingAgent&new=true")
      } else {
        console.log("Additional steps required:", completeSignUp.status)
        setError("Please complete any additional required steps")
      }
    } catch (err: any) {
      console.error("Verification error:", JSON.stringify(err, null, 2))
      setError(err.errors?.[0]?.message || "Incorrect verification code")
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center">Sign Up</h2>
      
      {!pendingVerification ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Password (optional - leave blank for passwordless)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Optional"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full">
            Sign Up
          </Button>
          
          {/* CAPTCHA container */}
          <div id="clerk-captcha"></div>
        </form>
      ) : (
        <form onSubmit={handleVerification} className="space-y-4">
          <p className="text-center text-gray-600">
            Enter the verification code sent to {email}
          </p>
          
          <div>
            <label className="block text-sm font-medium mb-1">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2 border rounded text-center text-lg"
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full">
            Verify Email
          </Button>
        </form>
      )}
    </div>
  )
}