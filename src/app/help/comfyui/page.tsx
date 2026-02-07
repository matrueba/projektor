"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ComfyUIHelpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-bold text-xl">ComfyUI Setup Guide</h1>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Configure ComfyUI for Projektor
            </h2>
            <p className="text-muted-foreground text-lg">
              Learn how to set up and configure ComfyUI to work with Projektor
              for AI-powered image and video generation.
            </p>
          </div>

          <div className="grid gap-6">
            {/* Step 1 */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Open ComfyUI</h3>
                  <p className="text-muted-foreground">
                    Launch ComfyUI on your machine. Make sure it&apos;s running
                    and accessible before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Go to Templates
                  </h3>
                  <p className="text-muted-foreground">
                    Navigate to the Templates section in ComfyUI to access the
                    required workflows.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                  3
                </div>
                <div className="w-full">
                  <h3 className="text-xl font-semibold mb-2">
                    Download Required Models
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    To get the models used by Projektor, navigate to the
                    following templates and accept the model download prompts.
                    <span className="block mt-2 text-amber-500 font-medium">
                      ⚠️ The combined download size is approximately 60GB
                    </span>
                  </p>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                      <span className="text-sm font-medium text-primary">
                        3.1
                      </span>
                      <div>
                        <span className="font-medium">
                          Z-Image-turbo Text to Image
                        </span>
                        <p className="text-sm text-muted-foreground">
                          Required for text-to-image generation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                      <span className="text-sm font-medium text-primary">
                        3.2
                      </span>
                      <div>
                        <span className="font-medium">
                          Wan2.2 14B Image to Video
                        </span>
                        <p className="text-sm text-muted-foreground">
                          Required for image-to-video generation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-dashed border-muted-foreground/30">
                      <span className="text-sm font-medium text-primary">
                        3.3
                      </span>
                      <div>
                        <span className="font-medium">
                          Qwen Image-Edit 2509
                        </span>
                        <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                          Optional
                        </span>
                        <p className="text-sm text-muted-foreground">
                          Only required if you want to use reference images
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
