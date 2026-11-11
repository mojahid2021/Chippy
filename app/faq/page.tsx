import type { Metadata } from "next"
import { FaqSection, MarketingShell, PageHero } from "@/components/marketing/sections"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to what shop owners ask about Chippy: setup, replies, languages, plans, and payment.",
}

export default function FaqPage() {
  return (
    <MarketingShell>
      <PageHero title="Questions shop owners ask us." intro="Setup, replies, and billing. If your question isn’t here, the free trial is the fastest way to find out." />
      <FaqSection detailed />
    </MarketingShell>
  )
}
