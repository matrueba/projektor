"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getSettingsAction, updateSettingsAction } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

export default function SettingsPage() {
  const toast = useToast()
  const [provider, setProvider] = useState("")
  const [model, setModel] = useState("")
  const [isLocal, setIsLocal] = useState(false)
  const [localUrl, setLocalUrl] = useState("")
  const [comfyUrl, setComfyUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const settings = await getSettingsAction()
      setProvider(settings.provider || "")
      setModel(settings.model || "")
      setIsLocal(settings.isLocal)
      setLocalUrl(settings.localUrl || "")
      setComfyUrl(settings.comfyUrl || "127.0.0.1:8188")
    })()
  }, [])

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      await updateSettingsAction({
        isLocal,
        localUrl,
        comfyUrl,
        model,
        provider,
      })
      toast.showToast("Success", "Configuration saved successfully", "success")
    } catch (error) {
      toast.showToast("Error", "Failed to save configuration", "error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      {/* Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center text-[#64748B] hover:text-[#2D3748] transition-colors duration-200 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 group-hover:-translate-x-1 transition-transform"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back dashboard
        </Link>
      </div>

      {/* Model Configuration Section */}
      <div className="backdrop-blur-xl bg-white/80 border border-[#A8A4CE]/30 rounded-2xl p-8 shadow-lg shadow-[#A8A4CE]/10 mb-8">
        <div className="flex items-center gap-2 mb-6 text-[#A8A4CE]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
            <path d="M12 2a10 10 0 0 1 10 10h-10V2z" />
            <path d="M12 12 2.1 12a10.05 10.05 0 0 0 19.8 0Z" />
          </svg>
          <h2 className="text-xl font-semibold text-[#2D3748]">
            Model Configuration
          </h2>
        </div>

        <div className="space-y-6">
          {/* Toggle Local */}
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div>
              <h3 className="font-medium text-[#2D3748]">Use Local Model</h3>
              <p className="text-sm text-[#64748B]">
                Connect to a local inference server like Ollama.
              </p>
            </div>
            <button
              onClick={() => setIsLocal(!isLocal)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white ${isLocal ? "bg-primary" : "bg-primary/20"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${isLocal ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {isLocal ? (
            <div className="grid gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Local Server URL
                </label>
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full bg-white text-[#2D3748] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 outline-none transition-all placeholder:text-[#A0AEC0] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="llama3"
                  className="w-full bg-white text-[#2D3748] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 outline-none transition-all placeholder:text-[#A0AEC0] font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Provider
                </label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="openai"
                  className="w-full bg-white text-[#2D3748] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 outline-none transition-all placeholder:text-[#A0AEC0] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o"
                  className="w-full bg-white text-[#2D3748] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 outline-none transition-all placeholder:text-[#A0AEC0] font-mono"
                />
              </div>
            </div>
          )}

          {!isLocal && (
            <>
              {/* API Key Warning */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-500 flex-shrink-0"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
                <p className="text-sm text-amber-700 animate-pulse font-medium">
                  Make sure you have included the API key for the selected
                  provider in the{" "}
                  <code className="bg-amber-100 px-1 rounded">.env</code> file
                </p>
              </div>

              <p className="text-xs text-[#64748B]">
                View available providers and models at{" "}
                <a
                  href="https://mastra.ai/models/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A8A4CE] hover:text-[#8B87B3] underline underline-offset-2 transition-colors"
                >
                  mastra.ai/models/providers
                </a>
              </p>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveConfig}
              className="px-6 py-2 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-colors shadow-lg shadow-[#6B9080]/20"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      {/* ComfyUI Configuration Section */}
      <div className="backdrop-blur-xl bg-white/80 border border-[#A8A4CE]/30 rounded-2xl p-8 shadow-lg shadow-[#A8A4CE]/10">
        <div className="flex items-center gap-2 mb-6 text-[#A8A4CE]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21 16-4 4-4-4" />
            <path d="M17 20V4" />
            <path d="m3 8 4-4 4 4" />
            <path d="M7 4v16" />
          </svg>
          <h2 className="text-xl font-semibold text-[#2D3748]">
            ComfyUI Configuration
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#64748B] mb-2">
              ComfyUI Server URL
            </label>
            <input
              type="text"
              value={comfyUrl}
              onChange={(e) => setComfyUrl(e.target.value)}
              placeholder="localhost:8188"
              className="w-full bg-white text-[#2D3748] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 outline-none transition-all placeholder:text-[#A0AEC0] font-mono"
            />
            <p className="mt-2 text-xs text-[#64748B]">
              The URL where your ComfyUI instance is running. Default is usually
              localhost:8188
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveConfig}
              className="px-6 py-2 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg transition-colors shadow-lg shadow-[#6B9080]/20"
            >
              Save ComfyUI Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
