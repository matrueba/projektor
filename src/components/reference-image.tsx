"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Trash2, Plus } from "lucide-react"

const MAX_IMAGES = 3

export function ReferenceImageComponent({
  uploadedImages,
  setUploadedImages,
}: {
  uploadedImages: string[]
  setUploadedImages: (images: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    if (uploadedImages.length >= MAX_IMAGES) return

    setIsUploading(true)
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImages([...uploadedImages, reader.result as string])
      setIsUploading(false)
      // Reset input so the same file can be selected again
      if (inputRef.current) inputRef.current.value = ""
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
        disabled={isUploading || uploadedImages.length >= MAX_IMAGES}
      />

      {/* Grid of uploaded images */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {uploadedImages.map((image, index) => (
            <div
              key={index}
              className="relative aspect-video group border rounded-md overflow-hidden bg-muted/50"
            >
              <img
                src={image}
                alt={`Reference ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Add more button - shown if less than MAX_IMAGES */}
          {uploadedImages.length < MAX_IMAGES && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="aspect-video border border-dashed rounded-md bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">Add image</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state - no images uploaded yet */}
      {uploadedImages.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-md bg-muted/50">
          <ImageIcon className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Use as style/structure reference
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Upload up to {MAX_IMAGES} images
          </p>
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="hover:bg-muted/90"
          >
            {isUploading ? "Uploading..." : "Upload Reference Image"}
          </Button>
        </div>
      )}
    </div>
  )
}
