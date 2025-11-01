"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserStore } from "@/lib/stores/userStore"
import { AlertCircle, Loader2 } from "lucide-react"

export default function SignIn() {
  const { getSavedEmail, validateProfile } = useUserStore()
  
  // Initialize form data with saved email if available
  const [formData, setFormData] = useState(() => {
    const savedEmail = getSavedEmail()
    return {
      email: savedEmail || "",
      password: "",
      firstName: "",
      lastName: "",
      phone: ""
    }
  })
  const [isLogin, setIsLogin] = useState(true)
  const [rememberMe, setRememberMe] = useState(() => !!getSavedEmail()) // Auto-check if email was saved
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const { login, register, isLoading, error } = useUserStore()
  const router = useRouter()

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await validateProfile()
        if (isValid) {
          router.push("/dashboard")
          return
        }
      } catch {
        // Continue to show login form
      }
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [validateProfile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLogin) {
      const success = await login(formData.email, formData.password, rememberMe)
      if (success) {
        router.push("/dashboard")
      }
    } else {
      const success = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined
      })
      if (success) {
        router.push("/dashboard")
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {isCheckingAuth ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      ) : (
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Sign In" : "Create Account"}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {isLogin
              ? "Welcome back! Please sign in to your account."
              : "Join SocialAI and start automating your social media."
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required={!isLogin}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required={!isLogin}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                minLength={8}
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Remember me (stay logged in for 1 year)
                </label>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}