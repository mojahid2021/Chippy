"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserStore } from "@/lib/stores/userStore"
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Phone, User } from "lucide-react"
import { Logo } from "@/components/logo"
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
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <Link href="/" aria-label="BDChatPro home" className="w-fit"><Logo /></Link>
        <div aria-hidden className="display flex flex-col gap-3 text-[clamp(2.5rem,5vw,5rem)]">
          <p className="self-start rounded-[0.38em] rounded-bl-[0.06em] bg-white px-[0.4em] pb-[0.1em] pt-[0.16em] text-ink">XL ache?</p>
          <p className="self-end rounded-[0.38em] rounded-br-[0.06em] bg-marigold px-[0.4em] pb-[0.1em] pt-[0.16em] text-ink">Ji, ache!</p>
        </div>
        <p className="max-w-[40ch] text-lg leading-relaxed text-sidebar-foreground">
          Your orders and Messenger conversations are waiting on the other side.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link href="/" aria-label="BDChatPro home" className="mb-8 lg:hidden"><Logo /></Link>
        {isCheckingAuth ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-sm text-muted-foreground">Checking your session</p>
          </div>
        ) : (
          <div className="w-full max-w-md">
              <div className="rounded-xl bg-card border border-border p-6 sm:p-8 shadow-xl">

                {/* Switcher Tabs */}
                <div className="flex p-1 rounded-md bg-muted border border-border mb-5">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                      isLogin 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                      !isLogin 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <div className="mb-5">
                  <h2 className="display text-3xl text-foreground">
                    {isLogin ? "Welcome back" : "Get started with BDChatPro"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
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
                          <label htmlFor="firstName" className="block text-xs font-medium text-foreground/80">
                            First Name <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              name="firstName"
                              type="text"
                              required={!isLogin}
                              value={formData.firstName}
                              onChange={handleInputChange}
                              placeholder="Rahim"
                              className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="lastName" className="block text-xs font-medium text-foreground/80">
                            Last Name <span className="text-destructive">*</span>
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required={!isLogin}
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Uddin"
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="phone" className="block text-xs font-medium text-foreground/80">
                          Phone Number <span className="text-muted-foreground">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+880 1712-345678"
                            className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-xs font-medium text-foreground/80">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="merchant@example.com"
                        className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-xs font-medium text-foreground/80">
                      Password <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••••••"
                        minLength={8}
                        className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>
                  </div>

                  {isLogin && (
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded"
                      />
                      <label
                        htmlFor="remember-me"
                        className="text-xs text-muted-foreground hover:text-foreground/80 cursor-pointer select-none"
                      >
                        Keep me signed in for 1 year
                      </label>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive-soft border border-destructive/30 text-destructive text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                      <p>{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-md transition-colors"
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

                <div className="mt-5 pt-4 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    {isLogin ? "Don't have an account yet?" : "Already registered?"}{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-primary hover:text-primary font-semibold ml-1"
                    >
                      {isLogin ? "Sign up for free" : "Sign in here"}
                    </button>
                  </p>
                </div>
              </div>
          </div>
        )}
      </main>
    </div>
  )
}