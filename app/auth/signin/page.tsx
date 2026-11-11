"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserStore } from "@/lib/stores/userStore"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Logo, LogoMark } from "@/components/logo"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function SignIn() {
  const { getSavedEmail, validateProfile, login, register, isLoading, error } = useUserStore()
  const router = useRouter()

  const [formData, setFormData] = useState(() => ({
    email: getSavedEmail() || "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  }))
  const [isLogin, setIsLogin] = useState(true)
  const [rememberMe, setRememberMe] = useState(() => !!getSavedEmail())
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Landing page CTAs link here with ?mode=signup.
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setIsLogin(false)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (await validateProfile()) {
          router.push("/dashboard")
          return
        }
      } catch {
        // Not signed in: show the form.
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
        toast({ variant: "success", title: "Welcome back", description: "Opening your workspace." })
        router.push("/dashboard")
      } else {
        toast({ variant: "destructive", title: "Couldn’t sign you in", description: error || "Check your email and password, then try again." })
      }
      return
    }

    const success = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
    })
    if (success) {
      toast({ variant: "success", title: "Account created", description: "Let’s get your page set up." })
      router.push("/dashboard")
    } else {
      toast({ variant: "destructive", title: "Couldn’t create your account", description: error || "Check the details and try again." })
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  return (
    <div className="min-h-screen bg-card lg:grid lg:grid-cols-[1fr_1fr]">
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <Link href="/" aria-label="Chippy home" className="w-fit"><Logo /></Link>

        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-10">
          {isCheckingAuth ? (
            <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <LogoMark className="size-9 animate-bounce" />
              Checking your session
            </div>
          ) : (
            <>
              <h1 className="text-3xl tracking-[-0.03em]">{isLogin ? "Welcome back" : "Create your account"}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isLogin ? "Sign in to your shop’s inbox and assistants." : "Free for 14 days. No card needed."}
              </p>

              <div role="tablist" aria-label="Account" className="mt-6 grid grid-cols-2 rounded-xl bg-secondary p-1 text-sm">
                {[true, false].map((login) => (
                  <button
                    key={String(login)}
                    role="tab"
                    type="button"
                    aria-selected={isLogin === login}
                    onClick={() => setIsLogin(login)}
                    className={cn(
                      "rounded-lg py-1.5 font-medium text-muted-foreground transition-colors",
                      isLogin === login && "bg-card text-foreground shadow-sm"
                    )}
                  >
                    {login ? "Sign in" : "Sign up"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName">First name</Label>
                        <Input id="firstName" name="firstName" autoComplete="given-name" required value={formData.firstName} onChange={onChange} placeholder="Rahim" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input id="lastName" name="lastName" autoComplete="family-name" required value={formData.lastName} onChange={onChange} placeholder="Uddin" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">
                        Phone <span className="font-normal text-muted-foreground">(optional)</span>
                      </Label>
                      <Input id="phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={onChange} placeholder="+880 1712-345678" />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={onChange} placeholder="you@yourshop.com" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={onChange}
                      placeholder={isLogin ? "Your password" : "At least 8 characters"}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <label htmlFor="remember-me" className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c === true)} />
                    Keep me signed in
                  </label>
                )}

                {error && (
                  <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="animate-spin" />}
                  {isLoading ? (isLogin ? "Signing in" : "Creating account") : isLogin ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isLogin ? "New to Chippy?" : "Already have an account?"}{" "}
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-medium text-foreground underline decoration-input underline-offset-4 hover:decoration-foreground">
                  {isLogin ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </main>

      <aside className="relative hidden overflow-hidden bg-brand lg:m-2 lg:flex lg:flex-col lg:justify-between lg:rounded-3xl lg:border-2 lg:border-ink lg:p-12">
        <p className="display max-w-[14ch] text-5xl">Customers are messaging. Chippy’s on it.</p>
        <div aria-hidden className="flex flex-col gap-2.5 text-base">
          <p className="max-w-[80%] self-start rounded-2xl rounded-bl-md border-2 border-ink bg-card px-4 py-2.5">XL ache? Price koto?</p>
          <p className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-white">Ji ache! ৳১,৮৫০, Dhaka-y free delivery 🙂</p>
          <p className="typing flex w-fit gap-1 self-start rounded-2xl rounded-bl-md border-2 border-ink bg-card px-4 py-3.5">
            <span className="size-1.5 rounded-full bg-ink" />
            <span className="size-1.5 rounded-full bg-ink" />
            <span className="size-1.5 rounded-full bg-ink" />
          </p>
        </div>
        <p className="text-sm">Replies in Bangla, Banglish, and English.</p>
      </aside>
    </div>
  )
}
