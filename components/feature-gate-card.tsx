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
    <Card className="border-pop/30 bg-gradient-to-br overflow-hidden relative">
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-pop-soft rounded-full blur-2xl pointer-events-none" />
      <CardContent className="p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-pop-soft border border-pop/30 flex items-center justify-center mx-auto mb-4 text-pop">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="bg-pop hover:bg-pop/90 text-white text-xs px-5">
            <Link href="/dashboard/purchase">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Upgrade to {planRequired}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-foreground text-xs">
            <Link href="/dashboard/subscription">View All Plans</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
