"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Bot, Calendar, BarChart, MessageSquare, Link2, Zap, Shield, Star, Check, Menu, X, Twitter, Linkedin, Instagram, Facebook, Play, Quote, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm"
      >
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">SocialAI</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Pricing</a>
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/signin" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Sign In</Link>
              <Link href="/auth/signin">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="md:hidden mt-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
              <a href="#features" className="block text-gray-600">Features</a>
              <a href="#how-it-works" className="block text-gray-600">How It Works</a>
              <a href="#testimonials" className="block text-gray-600">Testimonials</a>
              <Link href="/auth/signin"><Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button></Link>
            </motion.div>
          )}
        </nav>
      </motion.header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Trusted by 10,000+ businesses</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900">
                Automate Your Social Media with AI
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Save hours every day with intelligent automation. Generate content, schedule posts, and engage your audience across Facebook and Instagram—all powered by AI.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">4.9/5</span>
                  <span>(2,000+ reviews)</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                <div className="bg-white p-8 aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-12 w-12 text-blue-600" />
                    </div>
                    <p className="text-gray-500 font-medium">Dashboard Preview</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-20 -z-10"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-20 -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
              <div className="text-gray-600">Posts Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Powerful Features for Social Media Success
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to dominate social media, powered by cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Bot className="h-8 w-8 text-blue-600" />}
              title="AI Content Generation"
              description="Create engaging posts, captions, and responses in seconds with our advanced AI engine trained on millions of successful posts."
              color="blue"
            />
            <FeatureCard
              icon={<Calendar className="h-8 w-8 text-green-600" />}
              title="Smart Scheduling"
              description="Auto-post at peak engagement times with intelligent scheduling algorithms that analyze your audience behavior."
              color="green"
            />
            <FeatureCard
              icon={<BarChart className="h-8 w-8 text-purple-600" />}
              title="Analytics Dashboard"
              description="Track growth, engagement, and ROI with comprehensive analytics and actionable insights in real-time."
              color="purple"
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8 text-red-600" />}
              title="AI Auto-Reply"
              description="Automatically respond to comments and DMs with personalized, context-aware AI that sounds human."
              color="red"
            />
            <FeatureCard
              icon={<Link2 className="h-8 w-8 text-orange-600" />}
              title="Multi-Platform Sync"
              description="Manage Facebook, Instagram, and more from one unified dashboard. Schedule once, post everywhere."
              color="orange"
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-indigo-600" />}
              title="Lightning Fast"
              description="Blazing fast workflow with instant AI processing and real-time updates. No lag, no waiting."
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">No technical skills required. Start automating in minutes.</p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <HowItWorksStep
                step="1"
                title="Connect Accounts"
                description="Securely link your Facebook and Instagram accounts with OAuth in under 60 seconds."
                icon={<Link2 className="h-8 w-8 text-white" />}
              />
              <HowItWorksStep
                step="2"
                title="Generate Content"
                description="Use AI to create a month's worth of viral content with just a few clicks and prompts."
                icon={<Bot className="h-8 w-8 text-white" />}
              />
              <HowItWorksStep
                step="3"
                title="Automate & Grow"
                description="Sit back as AI posts, engages, and analyzes your social media performance 24/7."
                icon={<TrendingUp className="h-8 w-8 text-white" />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Loved by Thousands of Businesses
            </h2>
            <p className="text-xl text-gray-600">See what our customers have to say</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <TestimonialCard
              quote="SocialAI has transformed how we manage our social media. We've saved 20+ hours per week!"
              author="Sarah Johnson"
              role="Marketing Director at TechCorp"
              rating={5}
            />
            <TestimonialCard
              quote="The AI content generation is incredible. Our engagement rates have doubled since we started using it."
              author="Michael Chen"
              role="Founder of GrowthLab"
              rating={5}
            />
            <TestimonialCard
              quote="Best investment for our agency. Managing 50+ clients is now effortless with SocialAI's automation."
              author="Emily Rodriguez"
              role="CEO of Social Buzz Agency"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Social Media?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses automating their social media success. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 px-8">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700 px-8">
                Schedule a Demo
              </Button>
            </div>
            <p className="text-sm text-blue-100 mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SocialAI</span>
              </div>
              <p className="text-sm">AI-powered social media automation for the modern creator and business.</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm">© 2025 SocialAI, Inc. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Feature Card Component
const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) => {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    purple: "bg-purple-100",
    red: "bg-red-100",
    orange: "bg-orange-100",
    indigo: "bg-indigo-100",
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 h-full">
        <CardHeader>
          <div className={`w-14 h-14 rounded-xl ${bgColors[color]} flex items-center justify-center mb-4`}>
            {icon}
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// How It Works Step Component
const HowItWorksStep = ({ step, title, description, icon }: { step: string; title: string; description: string; icon: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
    <div className="relative inline-block mb-6">
      <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center relative z-10 shadow-lg">
        {icon}
      </div>
    </div>
    <div className="text-6xl font-bold text-blue-100 mb-2">{step}</div>
    <h3 className="text-2xl font-semibold mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
)

// Testimonial Card Component
const TestimonialCard = ({ quote, author, role, rating }: { quote: string; author: string; role: string; rating: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
    <Card className="bg-white border-gray-200 h-full">
      <CardContent className="pt-6">
        <div className="flex mb-4">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          ))}
        </div>
        <Quote className="h-8 w-8 text-blue-600 mb-4" />
        <p className="text-gray-700 mb-6 italic">&quot;{quote}&quot;</p>
        <div>
          <div className="font-semibold text-gray-900">{author}</div>
          <div className="text-sm text-gray-600">{role}</div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)
