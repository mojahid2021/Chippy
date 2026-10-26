"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserStore } from "@/lib/stores/userStore"
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Lock,
  Mail,
  User,
  Phone
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function SignIn() {
  const { getSavedEmail, validateProfile } = useUserStore()
  
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
  const [rememberMe, setRememberMe] = useState(() => !!getSavedEmail())
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const { login, register, isLoading, error } = useUserStore()
  const router = useRouter()

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
        toast({
          variant: "success",
          title: "Welcome back!",
          description: "Signed in successfully. Launching your workspace...",
        })
        router.push("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error || "Invalid email or password. Please try again.",
        })
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
        toast({
          variant: "success",
          title: "Account created!",
          description: "Your workspace has been prepared. Welcome aboard!",
        })
        router.push("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error || "Unable to create account. Please check details.",
        })
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
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-center relative">
      {/* Top brand header */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              BDChat<span className="text-blue-500">Pro</span>
            </span>
          </div>
        </Link>
        <Link 
          href="/" 
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 py-1.5 px-3 rounded-md border border-slate-800 hover:bg-slate-800"
        >
          <span>Back to Home</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        {isCheckingAuth ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">Verifying session...</p>
          </div>
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Value Showcase */}
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-between pr-4 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0F172A] border border-slate-800 text-xs font-medium text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Next-Gen Facebook Commerce Automation</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
                  Turn Facebook Messages into Delivered Orders 24/7.
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Connect your Facebook Page, let bilingual AI answer customer queries in natural Banglish, check inventory in real time, and auto-confirm orders directly to your CRM.
                </p>
              </div>

              {/* Preview Card */}
              <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      AI
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">BDChatPro Sales Bot</p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Messenger Bot
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">Live Demo</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-md rounded-tr-none max-w-[80%]">
                      Ei Panjabi tar Black XL size ache? Price koto?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#1E293B] text-slate-200 border border-slate-700 px-3 py-2 rounded-md rounded-tl-none max-w-[85%] space-y-1">
                      <p className="font-medium text-white">Ji bhai, Black XL stock-e ache!</p>
                      <p className="text-[11px] text-slate-400">Premium Cotton Panjabi • Price ৳১,৮৫০ (Free Delivery).</p>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-700 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-semibold">Ready to Order</span>
                        <span className="text-blue-400 underline cursor-pointer">Confirm Address →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-md bg-[#0F172A] border border-slate-800">
                  <p className="text-base font-bold text-white tracking-tight">1,200+</p>
                  <p className="text-[11px] text-slate-400">BD Merchants</p>
                </div>
                <div className="p-3 rounded-md bg-[#0F172A] border border-slate-800">
                  <p className="text-base font-bold text-white tracking-tight">99.8%</p>
                  <p className="text-[11px] text-slate-400">Order Accuracy</p>
                </div>
                <div className="p-3 rounded-md bg-[#0F172A] border border-slate-800">
                  <p className="text-base font-bold text-white tracking-tight">&lt; 1.2s</p>
                  <p className="text-[11px] text-slate-400">Response Time</p>
                </div>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="lg:col-span-6 w-full max-w-md mx-auto">
              <div className="rounded-lg bg-[#0F172A] border border-slate-800 p-6 sm:p-7 shadow-xl">

                {/* Switcher Tabs */}
                <div className="flex p-1 rounded-md bg-[#1E293B] border border-slate-800 mb-5">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                      isLogin 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                      !isLogin 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <div className="mb-5">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {isLogin ? "Welcome back" : "Get started with BDChatPro"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isLogin
                      ? "Enter your credentials to access your tenant workspace."
                      : "Start automating your Facebook Page sales in less than 2 minutes."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {!isLogin && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label htmlFor="firstName" className="block text-xs font-medium text-slate-300">
                            First Name <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <Input
                              id="firstName"
                              name="firstName"
                              type="text"
                              required={!isLogin}
                              value={formData.firstName}
                              onChange={handleInputChange}
                              placeholder="Rahim"
                              className="pl-9 bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="lastName" className="block text-xs font-medium text-slate-300">
                            Last Name <span className="text-red-400">*</span>
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required={!isLogin}
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Uddin"
                            className="bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="phone" className="block text-xs font-medium text-slate-300">
                          Phone Number <span className="text-slate-500">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+880 1712-345678"
                            className="pl-9 bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md h-9 text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-xs font-medium text-slate-300">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="merchant@example.com"
                        className="pl-9 bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                        Password <span className="text-red-400">*</span>
                      </label>
                      {isLogin && (
                        <Link 
                          href="/auth/forgot-password" 
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••••••"
                        minLength={8}
                        className="pl-9 bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md h-9 text-xs"
                      />
                    </div>
                  </div>

                  {isLogin && (
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                      />
                      <label
                        htmlFor="remember-me"
                        className="text-xs text-slate-400 hover:text-slate-300 cursor-pointer select-none"
                      >
                        Keep me signed in for 1 year
                      </label>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-950/60 border border-red-800 text-red-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                      <p>{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isLogin ? "Signing in..." : "Creating Workspace..."}</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <span>{isLogin ? "Sign In to Workspace" : "Create Account & Get Started"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    {isLogin ? "Don't have an account yet?" : "Already registered?"}{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-400 hover:text-blue-300 font-semibold ml-1"
                    >
                      {isLogin ? "Sign up for free" : "Sign in here"}
                    </button>
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        <p>© {new Date().getFullYear()} BDChatPro. All rights reserved. Built for Bangladesh F-Commerce.</p>
      </footer>
    </div>
  )
}