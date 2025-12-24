'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Trash2 } from "lucide-react"



export function ReferenceImageComponent({ uploadedImage, setUploadedImage }: { uploadedImage: string | null, setUploadedImage: (image: string | null) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        setIsUploading(true)
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onloadend = () => {
            setUploadedImage(reader.result as string)
            setIsUploading(false)
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="h-full">
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
                disabled={isUploading}
            />
            {uploadedImage ? (
                <div className="relative w-full aspect-video group border rounded-md overflow-hidden bg-muted/50">
                    <img src={uploadedImage} alt="Reference" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setUploadedImage(null)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-muted/50 w-full aspect-video">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium text-muted-foreground mb-4">
                        Use as style/structure reference
                    </p>
                    <Button onClick={() => (inputRef.current?.click())} disabled={isUploading} variant="outline" className="mt-2 hover:bg-muted/90">
                        {isUploading ? "Uploading..." : "Upload Reference Image (Optional)"}
                    </Button>
                </div>
            )}
        </div>
    )
}