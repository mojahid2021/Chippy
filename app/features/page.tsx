import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FeaturesSection, MarketingShell, PageHero, SIGNUP } from "@/components/marketing/sections"

export const metadata: Metadata = {
  title: "Features",
  description: "Replies in Bangla, Banglish, and English, an inbox for every page, shop knowledge, rules, and your choice of AI model.",
}

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <PageHero title="Built for how Bangladeshi shops sell." intro="Everything Chippy does to answer customers the way you would, and hand you the orders.">
        <Button asChild size="lg" className="rounded-full px-6"><Link href={SIGNUP}>Start 14-day free trial</Link></Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-6"><Link href="/pricing">See pricing</Link></Button>
      </PageHero>
      <div className="-mt-24"><FeaturesSection detailed /></div>
    </MarketingShell>
  )
}
