"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, Code, Copy, Check, Zap, MessageSquare, Palette, Settings, Shield, BarChart3, Bell, Users } from "lucide-react"
import { useState } from "react"

export default function WebsiteSetupPage() {
  const [copied, setCopied] = useState(false)
  const [embedCode] = useState(`<!-- BD ChatPro Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatProWidget']=o;w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'chatpro', 'https://cdn.bdchatpro.com/widget.js'));
  chatpro('init', { apiKey: 'YOUR_API_KEY' });
</script>`)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const features = [
    {
      title: "Chat Widget Integration",
      description: "Embed the AI chatbot on your website with a single script tag",
      icon: MessageSquare,
      status: "active",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Custom Branding",
      description: "Customize colors, logo, and position to match your brand",
      icon: Palette,
      status: "active",
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      title: "Widget Behavior",
      description: "Configure auto-greetings, delays, and trigger conditions",
      icon: Zap,
      status: "active",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Analytics & Tracking",
      description: "Track visitor interactions and conversation metrics",
      icon: BarChart3,
      status: "active",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Notifications",
      description: "Get real-time alerts for new conversations and queries",
      icon: Bell,
      status: "coming_soon",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      title: "Team Collaboration",
      description: "Enable multiple agents to handle customer chats",
      icon: Users,
      status: "coming_soon",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ]

  const integrationPlatforms = [
    { name: "WordPress", status: "active", type: "plugin" },
    { name: "Shopify", status: "active", type: "app" },
    { name: "Wix", status: "active", type: "embed" },
    { name: "Squarespace", status: "active", type: "code" },
    { name: "Webflow", status: "active", type: "embed" },
    { name: "React", status: "active", type: "npm" },
    { name: "Next.js", status: "active", type: "npm" },
    { name: "Angular", status: "active", type: "npm" },
  ]

  const securityFeatures = [
    "SSL/TLS Encryption",
    "GDPR Compliant",
    "IP Whitelisting",
    "Rate Limiting",
    "XSS Protection",
    "CORS Configuration",
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Website Setup</h1>
          <p className="text-sm text-slate-600 mt-0.5">Integrate AI chatbot into your website</p>
        </div>
        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
          <Globe className="h-3.5 w-3.5 mr-1.5" />
          View Documentation
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Active Websites</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">3</p>
            </div>
            <Globe className="h-10 w-10 text-blue-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Total Chats</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">1,234</p>
            </div>
            <MessageSquare className="h-10 w-10 text-emerald-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Avg Response Time</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">1.2s</p>
            </div>
            <Zap className="h-10 w-10 text-amber-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Satisfaction Rate</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">94%</p>
            </div>
            <BarChart3 className="h-10 w-10 text-violet-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Embed Code Section */}
      <Card className="p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Code className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Embed Code</h2>
              <p className="text-xs text-slate-600">Copy and paste this code before the closing &lt;/body&gt; tag</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={copyToClipboard}
            className={`h-8 ${copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy Code
              </>
            )}
          </Button>
        </div>
        <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-slate-100 font-mono">
            <code>{embedCode}</code>
          </pre>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Badge className="text-xs bg-blue-100 text-blue-700">JavaScript</Badge>
          <Badge className="text-xs bg-emerald-100 text-emerald-700">Async Loading</Badge>
          <Badge className="text-xs bg-violet-100 text-violet-700">Lightweight (12KB)</Badge>
        </div>
      </Card>

      {/* Features Grid */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-4">Integration Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <Badge className={`text-xs font-medium ${
                  feature.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {feature.status === 'active' ? 'Active' : 'Coming Soon'}
                </Badge>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4 h-8"
                disabled={feature.status === 'coming_soon'}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Configure
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Integration */}
        <Card className="p-5 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Platform Integration
          </h2>
          <div className="space-y-2">
            {integrationPlatforms.map((platform, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{platform.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{platform.type} integration</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Setup
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Features */}
        <Card className="p-5 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Security & Compliance
          </h2>
          <div className="space-y-3">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-emerald-700" />
                </div>
                <span className="text-sm text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4 h-8">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Security Settings
          </Button>
        </Card>
      </div>

      {/* Widget Preview */}
      <Card className="p-6 border border-slate-200 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">Widget Preview</h2>
        <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-lg p-8 min-h-[300px] relative border-2 border-dashed border-slate-300">
          <div className="absolute bottom-6 right-6">
            <div className="bg-blue-600 rounded-full p-4 shadow-xl cursor-pointer hover:scale-105 transition-transform">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-center text-slate-500 mt-20">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Preview your chat widget</p>
            <p className="text-xs mt-1">Customize appearance in the settings</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
