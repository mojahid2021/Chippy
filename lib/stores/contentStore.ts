import { create } from "zustand"

interface ContentItem {
  id: string
  text: string
  platform: "facebook" | "instagram"
  scheduledAt: Date
}

interface ContentState {
  content: ContentItem[]
  addContent: (item: ContentItem) => void
  removeContent: (id: string) => void
}

export const useContentStore = create<ContentState>((set) => ({
  content: [],
  addContent: (item) => set((state) => ({ content: [...state.content, item] })),
  removeContent: (id) => set((state) => ({ content: state.content.filter((c) => c.id !== id) })),
}))