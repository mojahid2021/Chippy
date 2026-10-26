"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Bot,
  MessageSquare,
  Zap,
  Shield,
  Star,
  Check,
  Menu,
  X,
  Globe,
  Sparkles,
  ShoppingBag,
  Users,
  Building2,
  TrendingUp,
  Layers,
  Send,
  Lock,
  ChevronDown,
  ExternalLink,
  Cpu,
  CheckCircle2,
  Activity,
  Headphones,
  FileText,
  CreditCard,
  LifeBuoy,
  PhoneCall,
  ShieldCheck,
  CheckCircle
} from "lucide-react"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 selection:bg-blue-600 selection:text-white font-sans relative">
      
      {/* Top Notice Strip - Solid Dark Bar */}
      <div className="relative z-50 bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-semibold text-[10px] uppercase border border-blue-700/60">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>v2.4 Enterprise</span>
            </span>
            <span className="text-slate-300 truncate">
              Multi-Tenant Workspaces, Banglish AI Sales Bot & Instant Meta Webhook Engine are now live!
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-300 font-medium">Meta Verified Provider</span>
            </div>
            <span className="text-slate-700">|</span>
            <a 
              href="#pricing" 
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 group"
            >
              <span>Explore Plans</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Solid Enterprise Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-white">
                    BDChat<span className="text-blue-500">Pro</span>
                  </span>
                  <Badge className="bg-blue-950 text-blue-400 border border-blue-800 text-[9px] px-1 py-0 font-semibold rounded">
                    ENTERPRISE
                  </Badge>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#demo" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <span>Live Simulator</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </a>
              <a href="#solutions" className="hover:text-blue-400 transition-colors">Solutions</a>
              <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                Console
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#0F172A] border border-slate-800 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>99.98% Uptime</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-mono">Dhaka Edge</span>
            </div>

            <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold h-9 px-3.5 rounded-md">
              <Link href="/auth/signin">Sign In</Link>
            </Button>

            <Button asChild className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors">
              <Link href="/auth/signin" className="flex items-center gap-1.5">
                <span>Start Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md border border-slate-800 text-slate-400 hover:text-white bg-[#0F172A]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-6 border-t border-slate-800 bg-[#090D16] space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-300 hover:text-white">Features</a>
            <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-300 hover:text-white">Live Simulator</a>
            <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-300 hover:text-white">Solutions</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-300 hover:text-white">Pricing</a>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full border-slate-800 text-slate-200 rounded-md">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                <Link href="/auth/signin">Get Started Free</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0F172A] border border-slate-800 text-xs font-medium text-slate-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-white font-semibold">Bangladesh F-Commerce Platform</span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-400">Natural Banglish LLM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Turn Facebook Messenger Into Your Highest-Converting Sales Team
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop losing customer orders overnight. BDChatPro connects to your Facebook Page, answers inquiries in conversational Bengali and Banglish, verifies inventory, and creates confirmed orders directly.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto h-11 px-6 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm">
              <Link href="/auth/signin" className="flex items-center gap-2">
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-11 px-5 rounded-md border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-200 text-xs font-semibold">
              <a href="#demo" className="flex items-center gap-2">
                <span>Test Live Simulator</span>
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </a>
            </Button>
          </div>

          {/* Enterprise Metrics Strip - Solid Cards */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto p-4 rounded-lg bg-[#0F172A] border border-slate-800">
            <div className="p-3 text-left border-r border-slate-800">
              <p className="text-2xl font-bold text-white tracking-tight">5,200,000+</p>
              <p className="text-xs text-slate-400 mt-0.5">Automated Chats Handled</p>
            </div>
            <div className="p-3 text-left border-r border-slate-800">
              <p className="text-2xl font-bold text-emerald-400 tracking-tight">99.8%</p>
              <p className="text-xs text-slate-400 mt-0.5">Order Placement Accuracy</p>
            </div>
            <div className="p-3 text-left border-r border-slate-800">
              <p className="text-2xl font-bold text-blue-400 tracking-tight">4.2x</p>
              <p className="text-xs text-slate-400 mt-0.5">Average Conversion Lift</p>
            </div>
            <div className="p-3 text-left">
              <p className="text-2xl font-bold text-slate-200 tracking-tight">&lt; 1.2s</p>
              <p className="text-xs text-slate-400 mt-0.5">Median Response Latency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Chatbot Demo Section */}
      <section id="demo" className="py-20 bg-[#070B13] border-b border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F172A] border border-slate-800 text-xs font-semibold text-blue-400 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Messenger Experience</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Watch BDChatPro Close an Order in 20 Seconds
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              See how the bot understands customer intent, checks inventory, quotes sizes, and captures the delivery address automatically.
            </p>
          </div>

          {/* Interactive Chat Window Mockup */}
          <div className="max-w-xl mx-auto bg-[#0F172A] rounded-lg border border-slate-800 shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-3.5 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#1E293B]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Dhaka Fashion Boutique (BDChatPro AI)</p>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    Active on Facebook Messenger
                  </p>
                </div>
              </div>
              <Badge className="bg-[#0F172A] border border-slate-700 text-[10px] text-slate-400 rounded">
                Live Simulation
              </Badge>
            </div>

            {/* Conversation Flow */}
            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white px-3.5 py-2 rounded-lg rounded-tr-none max-w-[85%]">
                  Apu, ei Cotton Panjabi tar Black XL size ki available ache? Price koto?
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-[#1E293B] text-slate-100 border border-slate-700 px-3.5 py-2.5 rounded-lg rounded-tl-none max-w-[85%] space-y-1.5">
                  <p className="font-medium text-white">
                    Ji bhai! Black XL size stock-e ache.
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    Premium Cotton Semi-Long Panjabi • Price ৳১,৮৫০ (Dhaka city delivery charge matro ৮০ taka).
                  </p>
                  <div className="p-2 rounded bg-[#0F172A] border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-semibold">✓ In Stock (4 pcs left)</span>
                    <span className="text-blue-400 font-semibold">Cash On Delivery</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-blue-600 text-white px-3.5 py-2 rounded-lg rounded-tr-none max-w-[85%]">
                  Ami 1 piece nibo. Delivery kobe pabo? Address: House 12, Road 5, Dhanmondi, Dhaka. Phone: 01711223344
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-[#1E293B] text-slate-100 border border-slate-700 px-3.5 py-2.5 rounded-lg rounded-tl-none max-w-[85%] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Order Confirmed (#ORD-8821)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Dhaka shohore 24-48 hours-er bhetore delivery peye jaben. Total: ৳১,৯৩০ (Delivery charge shoho). Rider delivery-r age call korbe. Thank you!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1E293B] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Captured directly into your Orders dashboard</span>
              </span>
              <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                <span>Try with your page</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / Features Bento Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="bg-blue-950 text-blue-400 border border-blue-800 text-xs mb-2 rounded">
            Core Architecture
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Built for High-Growth Bangladeshi Merchants
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            Everything your business needs to scale Facebook and Instagram sales effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg bg-[#0F172A] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Natural Banglish Sales LLM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained specifically on Bangladeshi consumer chat habits. Understands colloquial expressions, product inquiries, and address formatting.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#0F172A] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Vector Catalog & Real-time Stock</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Semantic embeddings index your products instantly. The bot searches descriptions, sizes, and stock limits so you never oversell.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#0F172A] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Tenant Team Workspaces</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage multiple pages and brands from one login. Assign roles (Owner, Admin, Manager, Agent) with granular RBAC permissions.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[#070B13] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs mb-2 rounded">
              Simple BDT Pricing
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Predictable Plans for Every Merchant
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Pay locally using bKash, Nagad, or Bank Transfer. Cancel or upgrade anytime.
            </p>

            {/* Toggle */}
            <div className="mt-6 inline-flex items-center p-1 rounded-md bg-[#0F172A] border border-slate-800">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  billingCycle === "monthly" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                  billingCycle === "yearly" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1 rounded">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-6 rounded-lg bg-[#0F172A] border border-slate-800 flex flex-col justify-between space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400 mt-0.5">For single page merchants & startups</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {billingCycle === "yearly" ? "৳১,৫০০" : "৳১,৮৫০"}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <ul className="mt-5 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Up to 50 Products in Catalog</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1 Facebook Page Connected</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1,500 AI Conversations / mo</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Order Management & Receipts</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full border-slate-800 text-white hover:bg-slate-800 text-xs h-9 rounded-md">
                <Link href="/auth/signin">Get Started</Link>
              </Button>
            </div>

            {/* Growth Pro */}
            <div className="p-6 rounded-lg bg-[#0F172A] border-2 border-blue-600 flex flex-col justify-between space-y-5 relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded bg-blue-600 text-[10px] font-bold text-white tracking-wider uppercase">
                Most Popular
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Growth Pro</h3>
                <p className="text-xs text-slate-400 mt-0.5">For scaling Facebook shops & brands</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {billingCycle === "yearly" ? "৳৩,২০০" : "৳৩,৯৫০"}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <ul className="mt-5 space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited Products & Categories</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited AI Sales Conversations</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 5 Team Member Seats (RBAC)</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Custom AI Personalities & Prompts</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Priority bKash / WhatsApp Support</li>
                </ul>
              </div>
              <Button asChild className="w-full h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                <Link href="/auth/signin">Start 14-Day Free Trial</Link>
              </Button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-lg bg-[#0F172A] border border-slate-800 flex flex-col justify-between space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Enterprise Scale</h3>
                <p className="text-xs text-slate-400 mt-0.5">For multi-brand agencies & franchises</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {billingCycle === "yearly" ? "৳৭,২০০" : "৳৮,৯০০"}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <ul className="mt-5 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Multiple Brands & Tenancy</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited Team Seats</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Custom LLM Training on Catalog</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 99.99% SLA Dedicated Webhook Queue</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full border-slate-800 text-white hover:bg-slate-800 text-xs h-9 rounded-md">
                <Link href="/auth/signin">Contact Enterprise</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Multi-Column Footer - Solid Slate */}
      <footer className="border-t border-slate-800 bg-[#090D16] pt-14 pb-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main 5-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-slate-800">
            
            {/* Column 1: Brand & Mission */}
            <div className="lg:col-span-2 space-y-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">
                  BDChat<span className="text-blue-500">Pro</span>
                </span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed pr-4">
                The premier conversational AI platform for Bangladesh Facebook Commerce. Automatically turns Messenger inquiries into delivered orders 24/7 with native Banglish comprehension.
              </p>
              
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Meta Tech Provider Verified</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>256-Bit SSL Encrypted & Data Protected</span>
                </div>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Platform</h4>
              <ul className="space-y-1.5">
                <li><a href="#features" className="hover:text-white transition-colors">AI Sales Agent</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Interactive Simulator</a></li>
                <li><Link href="/dashboard/orders" className="hover:text-white transition-colors">Orders Pipeline</Link></li>
                <li><Link href="/dashboard/products" className="hover:text-white transition-colors">Vector Catalog Sync</Link></li>
                <li><Link href="/dashboard/configure-page" className="hover:text-white transition-colors">Meta Webhooks</Link></li>
                <li><Link href="/dashboard/team" className="hover:text-white transition-colors">Workspaces & Roles</Link></li>
              </ul>
            </div>

            {/* Column 3: Solutions */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-1.5">
                <li><span className="hover:text-white cursor-pointer transition-colors">Clothing & Panjabi</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Gadgets & Electronics</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Cosmetics & Skincare</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Cloud Kitchens & Bakery</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Wholesale & Agencies</span></li>
              </ul>
            </div>

            {/* Column 4: Developers */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Developers & Docs</h4>
              <ul className="space-y-1.5">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Merchant Console</Link></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">REST API Spec</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Webhook Payload Guide</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Banglish Prompt Engine</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Postman Collection</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">System Architecture</span></li>
              </ul>
            </div>

            {/* Column 5: Enterprise & Help */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise & Support</h4>
              <ul className="space-y-1.5">
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Plans</a></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Merchant Login</Link></li>
                <li><Link href="/auth/forgot-password" className="hover:text-white transition-colors">Password Recovery</Link></li>
                <li><Link href="/dashboard/subscription" className="hover:text-white transition-colors">bKash & Nagad Billing</Link></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Security & Compliance</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Support Hotline (+880)</span></li>
              </ul>
            </div>

          </div>

          {/* Payment Partners & Trust Strip */}
          <div className="py-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Supported Bangladesh Payment Gateways & Banking
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[#0F172A] border border-slate-800 text-slate-200 text-[11px] font-bold">
                bKash Merchant
              </span>
              <span className="px-2 py-0.5 rounded bg-[#0F172A] border border-slate-800 text-slate-200 text-[11px] font-bold">
                Nagad Direct
              </span>
              <span className="px-2 py-0.5 rounded bg-[#0F172A] border border-slate-800 text-slate-200 text-[11px] font-bold">
                Bank Wire / IBAN
              </span>
              <span className="px-2 py-0.5 rounded bg-[#0F172A] border border-slate-800 text-slate-200 text-[11px] font-bold">
                SSLCommerz
              </span>
            </div>
          </div>

          {/* Bottom Legal & Server Cluster */}
          <div className="pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px]">
            <p className="text-slate-400">
              © {new Date().getFullYear()} BDChatPro Technologies Ltd. Dhaka, Bangladesh. All rights reserved.
            </p>

            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Cluster: Dhaka Edge (ap-south-1)</span>
              </span>
              <span>•</span>
              <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
              <span>•</span>
              <span className="hover:text-slate-300 cursor-pointer">Merchant Agreement</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  )
}
