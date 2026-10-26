"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Sparkles, ArrowRight } from "lucide-react"

interface FeatureGateCardProps {
  title: string
  description: string
  featureKey: string
  planRequired?: string
}

export function FeatureGateCard({
  title,
  description,
  planRequired = "Pro or higher",
}: FeatureGateCardProps) {
  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-200/30 rounded-full blur-2xl pointer-events-none" />
      <CardContent className="p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-200/60 flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-sm">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 text-xs px-5">
            <Link href="/dashboard/purchase">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Upgrade to {planRequired}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-slate-300 text-slate-700 text-xs">
            <Link href="/dashboard/subscription">View All Plans</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
