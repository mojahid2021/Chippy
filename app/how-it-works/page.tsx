import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DayToDaySection, HowItWorksSection, MarketingShell, PageHero, SIGNUP } from "@/components/marketing/sections"

export const metadata: Metadata = {
  title: "How it works",
  description: "Connect your Facebook page, teach Chippy your shop, and let it answer Messenger customers. Live in about ten minutes.",
}

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <PageHero title="Live in ten minutes." intro="Three steps from a busy Messenger inbox to a page that answers customers and takes orders on its own.">
        <Button asChild size="lg" className="rounded-full px-6"><Link href={SIGNUP}>Start 14-day free trial</Link></Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-6"><Link href="/features">See features</Link></Button>
      </PageHero>
      <div className="-mt-16"><HowItWorksSection detailed /></div>
      <DayToDaySection />
    </MarketingShell>
  )
}
