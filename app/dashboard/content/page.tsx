"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Content() {
  const [prompt, setPrompt] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")

  const generateContent = async () => {
    // Mock AI generation for now
    setGeneratedContent(`Generated content based on: ${prompt}`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">AI Content Generator</h1>
      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter your prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button onClick={generateContent}>Generate</Button>
          {generatedContent && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p>{generatedContent}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}