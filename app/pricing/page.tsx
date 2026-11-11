import type { Metadata } from "next"
import { MarketingShell, PageHero } from "@/components/marketing/sections"
import { PricingSection } from "@/components/marketing/pricing-section"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple Chippy plans with a 14-day free trial. Pay with bKash, Nagad, or bank transfer. Change or cancel anytime.",
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <PageHero title="Simple plans." intro="Start with a free trial, no card needed. Pay with bKash, Nagad, or bank transfer, and change or cancel anytime." />
      <PricingSection detailed />
    </MarketingShell>
  )
}
