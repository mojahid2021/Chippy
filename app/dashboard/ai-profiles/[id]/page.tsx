"use client"

import { useParams } from "next/navigation"
import { AssistantEditor } from "../assistant-editor"

export default function EditAssistantPage() {
  const { id } = useParams<{ id: string }>()
  return <AssistantEditor profileId={id} />
}
