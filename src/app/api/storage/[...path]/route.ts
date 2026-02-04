import { NextRequest, NextResponse } from 'next/server'
import { readFile, getMimeType } from '@/lib/storage'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params
    const filePath = path.join('/')

    const fileBuffer = readFile(filePath)

    if (!fileBuffer) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const mimeType = getMimeType(filePath)

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(fileBuffer)

    return new NextResponse(uint8Array, {
        headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    })
}
