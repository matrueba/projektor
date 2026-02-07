import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { getMimeType } from "@/lib/storage"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await context.params
  const filePath = pathSegments.join("/")

  // We use src/content as the base directory
  const STORAGE_PATH = path.join(process.cwd(), "src", "content")
  const fullPath = path.join(STORAGE_PATH, filePath)

  if (!fs.existsSync(fullPath)) {
    return new NextResponse("File not found", { status: 404 })
  }

  try {
    const fileBuffer = fs.readFileSync(fullPath)
    const mimeType = getMimeType(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
