import WebSocket from "ws"
import fs from "fs/promises"
import { randomUUID } from "crypto"
import path from "path"
import { getSettings } from "@/lib/db"

/**
 * WebSocket client for communicating with ComfyUI server.
 * Handles workflow loading, prompt queuing, and result retrieval for image/video generation.
 */
export class ComfyUiClient {
  private serverAddress: string
  private clientId: string
  private ws: WebSocket | null = null

  constructor(serverAddress: string = "127.0.0.1:8188") {
    this.serverAddress = serverAddress
    this.clientId = randomUUID()
  }

  /**
   * Initializes the client by loading server address from settings.
   */
  async init(): Promise<void> {
    const settings = await getSettings()
    this.serverAddress = settings.comfyUrl
  }

  /**
   * Establishes WebSocket connection to ComfyUI server.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.ws = new WebSocket(
        `ws://${this.serverAddress}/ws?clientId=${this.clientId}`,
      )

      this.ws.on("open", () => {
        resolve()
      })

      this.ws.on("error", (err) => {
        reject(err)
      })
    })
  }

  /**
   * Closes the WebSocket connection.
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Loads a workflow JSON file from disk.
   * @param workflowPath - Path to the workflow JSON file
   */
  async loadWorkflow(workflowPath: string): Promise<any> {
    try {
      const data = await fs.readFile(workflowPath, "utf-8")
      return JSON.parse(data)
    } catch (error) {
      return null
    }
  }

  /**
   * Queues a workflow prompt for execution on ComfyUI.
   * @param workflow - The workflow object to execute
   */
  async queuePrompt(workflow: any): Promise<{ prompt_id: string } | null> {
    const data = {
      prompt: workflow,
      client_id: this.clientId,
    }

    try {
      const response = await fetch(`http://${this.serverAddress}/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return (await response.json()) as { prompt_id: string }
    } catch (error) {
      return null
    }
  }

  /**
   * Retrieves execution history for a completed prompt.
   * @param promptId - The prompt ID to fetch history for
   */
  async getHistory(promptId: string): Promise<any> {
    try {
      const response = await fetch(
        `http://${this.serverAddress}/history/${promptId}`,
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      return null
    }
  }

  /**
   * Downloads a generated image from ComfyUI server.
   * @param filename - Name of the file to retrieve
   * @param subfolder - Subfolder containing the file
   * @param folderType - Type of folder (output, input, temp)
   */
  async getImage(
    filename: string,
    subfolder: string,
    folderType: string,
  ): Promise<ArrayBuffer | null> {
    const params = new URLSearchParams({
      filename,
      subfolder,
      type: folderType,
    })

    try {
      const response = await fetch(
        `http://${this.serverAddress}/view?${params.toString()}`,
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.arrayBuffer()
    } catch (error) {
      return null
    }
  }

  /**
   * Uploads an image to ComfyUI server for use in workflows.
   * @param file - Path to the file or URL to upload
   * @param filename - Name to save the file as
   * @param overwrite - Whether to overwrite existing file
   */
  async uploadImage(
    file: string,
    filename: string = "image_reference.jpg",
    overwrite: boolean = false,
  ): Promise<any> {
    try {
      let imgBlob: Blob
      let finalFilename = filename
      let relativePath = file
      if (file.startsWith("/api/storage/")) {
        relativePath = file.replace("/api/storage/", "")
      }

      const STORAGE_PATH =
        process.env.STORAGE_PATH || path.join(process.cwd(), "src", "content")
      const fullPath = path.join(STORAGE_PATH, relativePath)

      try {
        const data = await fs.readFile(fullPath)
        imgBlob = new Blob([data])
        if (filename === "image_reference.jpg") {
          finalFilename = path.basename(fullPath)
        }
      } catch (readError) {
        console.warn(
          `Could not read local file ${fullPath}, falling back to fetch:`,
          readError,
        )
        const downloadImg = await fetch(file)
        imgBlob = await downloadImg.blob()
      }

      const formData = new FormData()
      formData.append("image", imgBlob, finalFilename)
      formData.append("subfolder", "")
      formData.append("overwrite", String(overwrite).toLowerCase())

      const response = await fetch(
        `http://${this.serverAddress}/upload/image`,
        {
          method: "POST",
          body: formData,
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const imgInfo = await response.json()
      return imgInfo
    } catch (error) {
      return null
    }
  }

  /**
   * Updates workflow with positive prompt and configures image dimensions.
   * @param workflow - The workflow object to modify
   * @param positivePrompt - The text prompt for generation
   */
  updateWorkflow(workflow: any, positivePrompt: string): any {
    const idToClassType: Record<string, string> = {}
    for (const [id, details] of Object.entries(workflow) as [string, any][]) {
      idToClassType[id] = details.class_type
    }

    const kSamplerId = Object.keys(idToClassType).find(
      (key) => idToClassType[key] === "KSampler",
    )
    const latentImageId = Object.keys(idToClassType).find(
      (key) => idToClassType[key] === "EmptySD3LatentImage",
    )

    if (latentImageId) {
      workflow[latentImageId].inputs.width = 1280
      workflow[latentImageId].inputs.height = 720
    }
    if (kSamplerId) {
      const seed = Math.floor(Math.random() * (10 ** 15 - 10 ** 14) + 10 ** 14)
      workflow[kSamplerId].inputs.seed = seed

      const textPromptId = workflow[kSamplerId].inputs.positive[0]
      if (workflow[textPromptId]) {
        workflow[textPromptId].inputs.text = positivePrompt
      }
    }

    return workflow
  }

  /**
   * Updates workflow for video generation with image input and video parameters.
   * @param workflow - The workflow object to modify
   * @param positivePrompt - The motion/action prompt
   * @param filename - Input image filename
   * @param length - Number of frames to generate
   * @param width - Output video width
   * @param height - Output video height
   */
  updateVideoWorkflow(
    workflow: any,
    positivePrompt: string,
    filename: string,
    length: number = 81,
    width: number = 1280,
    height: number = 720,
  ): any {
    const idToClassType: Record<string, string> = {}
    for (const [id, details] of Object.entries(workflow) as [string, any][]) {
      idToClassType[id] = details.class_type
    }

    const kSamplerId = Object.keys(idToClassType).find(
      (key) => idToClassType[key] === "KSamplerAdvanced",
    )
    const imageLoaderId = Object.keys(idToClassType).find(
      (key) => idToClassType[key] === "LoadImage",
    )
    const sizeId = Object.keys(idToClassType).find(
      (key) => idToClassType[key] === "WanImageToVideo",
    )

    if (sizeId) {
      workflow[sizeId].inputs.width = width
      workflow[sizeId].inputs.height = height
      workflow[sizeId].inputs.length = length
    }

    if (kSamplerId && imageLoaderId) {
      workflow[imageLoaderId].inputs.image = filename

      const sizeLengthId = workflow[kSamplerId].inputs.positive[0]
      if (workflow[sizeLengthId]) {
        const positivePromptId = workflow[sizeLengthId].inputs.positive[0]
        if (workflow[positivePromptId]) {
          workflow[positivePromptId].inputs.text = positivePrompt
        }
      }
    }

    return workflow
  }

  /**
   * Updates workflow for image-to-image generation with reference image.
   * @param workflow - The workflow object to modify
   * @param inputPath - Path to the input/reference image
   * @param positivePrompt - The text prompt for generation
   */
  updateImg2ImgWorkflow(
    workflow: any,
    inputPath: string,
    positivePrompt: string,
  ): any {
    this.updateWorkflow(workflow, positivePrompt)

    const idToClassType: Record<string, string> = {}
    for (const [id, details] of Object.entries(workflow) as [string, any][]) {
      idToClassType[id] = details.class_type
    }

    const imageLoaderId = Object.keys(idToClassType).find(
      (key) => idToClassType[key] === "LoadImage",
    )
    if (imageLoaderId) {
      const filename = path.basename(inputPath)
      workflow[imageLoaderId].inputs.image = filename
    }

    return workflow
  }

  /**
   * Tracks generation progress via WebSocket messages.
   * @param promptId - The prompt ID to track
   * @param onProgress - Callback function for progress updates
   */
  async trackProgress(
    promptId: string,
    onProgress?: (value: number, max: number) => void,
  ): Promise<boolean> {
    if (!this.ws) {
      return false
    }

    return new Promise((resolve, reject) => {
      const handleMessage = (data: WebSocket.RawData, isBinary: boolean) => {
        try {
          const message = isBinary
            ? JSON.parse(data.toString())
            : JSON.parse(String(data))

          if (message.type === "progress") {
            if (onProgress) {
              onProgress(message.data.value, message.data.max)
            }
          }

          if (
            message.type === "executed" &&
            message.data.prompt_id === promptId
          ) {
            this.ws?.off("message", handleMessage)
            resolve(true)
          }
        } catch (error) {
          throw error
        }
      }

      this.ws?.on("message", handleMessage)
    })
  }

  /**
   * Generates images using text-to-image workflow.
   * @param generationParameters - Object with positivePrompt and optional workflowPath
   * @param onProgress - Callback function for progress updates
   */
  async generateImage(
    generationParameters: {
      positivePrompt: string
      inputPath?: string
      workflowPath?: string
    },
    onProgress?: (value: number, max: number) => void,
  ): Promise<ArrayBuffer[]> {
    try {
      if (!this.ws) {
        await this.connect()
      }

      const workflowPath =
        generationParameters.workflowPath || "src/workflows/z-image-turbo.json"
      let workflow = await this.loadWorkflow(workflowPath)
      if (!workflow) throw new Error("Workflow not found")

      workflow = this.updateWorkflow(
        workflow,
        generationParameters.positivePrompt,
      )

      const promptResponse = await this.queuePrompt(workflow)
      if (!promptResponse) throw new Error("Failed to queue prompt")

      const promptId = promptResponse.prompt_id

      const completed = await this.trackProgress(promptId, onProgress)
      if (!completed) throw new Error("Generation failed or interrupted")

      const history = await this.getHistory(promptId)
      const outputs = history[promptId].outputs

      const results: ArrayBuffer[] = []

      for (const nodeId in outputs) {
        const nodeOutput = outputs[nodeId]
        if (nodeOutput.images) {
          for (const image of nodeOutput.images) {
            const imageData = await this.getImage(
              image.filename,
              image.subfolder,
              image.type,
            )
            if (imageData) {
              results.push(imageData)
            }
          }
        }
      }
      return results
    } catch (error) {
      return []
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Generates images using image-to-image workflow with a reference image.
   * @param generationParameters - Object with positivePrompt, referenceImage, and optional workflowPath
   * @param onProgress - Callback function for progress updates
   */
  async generateImage2Image(
    generationParameters: {
      positivePrompt: string
      referenceImage?: string
      workflowPath?: string
    },
    onProgress?: (value: number, max: number) => void,
  ): Promise<ArrayBuffer[]> {
    try {
      if (!this.ws) {
        await this.connect()
      }

      const workflowPath =
        generationParameters.workflowPath || "src/workflows/z-image-turbo.json"
      let workflow = await this.loadWorkflow(workflowPath)
      if (!workflow) throw new Error("Workflow not found")

      if (!generationParameters.referenceImage) {
        workflow = this.updateWorkflow(
          workflow,
          generationParameters.positivePrompt,
        )
        return []
      }

      await this.uploadImage(generationParameters.referenceImage)
      workflow = this.updateImg2ImgWorkflow(
        workflow,
        generationParameters.referenceImage,
        generationParameters.positivePrompt,
      )

      const promptResponse = await this.queuePrompt(workflow)
      if (!promptResponse) throw new Error("Failed to queue prompt")

      const promptId = promptResponse.prompt_id

      const completed = await this.trackProgress(promptId, onProgress)
      if (!completed) throw new Error("Generation failed or interrupted")

      const history = await this.getHistory(promptId)
      const outputs = history[promptId].outputs

      const results: ArrayBuffer[] = []

      for (const nodeId in outputs) {
        const nodeOutput = outputs[nodeId]
        if (nodeOutput.images) {
          for (const image of nodeOutput.images) {
            const imageData = await this.getImage(
              image.filename,
              image.subfolder,
              image.type,
            )
            if (imageData) {
              results.push(imageData)
            }
          }
        }
      }

      return results
    } catch (error) {
      return []
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Generates video from an image using image-to-video workflow.
   * @param generationParameters - Object with positivePrompt, imagePath, optional workflowPath and length
   * @param onProgress - Callback function for progress updates
   */
  async generateVideo(
    generationParameters: {
      positivePrompt: string
      imagePath: string
      workflowPath?: string
      length?: number
    },
    onProgress?: (value: number, max: number) => void,
  ): Promise<ArrayBuffer[]> {
    try {
      if (!this.ws) {
        await this.connect()
      }

      const workflowPath =
        generationParameters.workflowPath ||
        "src/workflows/video_wan2_2_14B_i2v.json"
      let workflow = await this.loadWorkflow(workflowPath)
      if (!workflow) throw new Error("Workflow not found")

      const response = await this.uploadImage(generationParameters.imagePath)
      const filename = response.name
      workflow = this.updateVideoWorkflow(
        workflow,
        generationParameters.positivePrompt,
        filename,
        generationParameters.length,
      )

      const promptResponse = await this.queuePrompt(workflow)
      if (!promptResponse) throw new Error("Failed to queue prompt")

      const promptId = promptResponse.prompt_id

      const completed = await this.trackProgress(promptId, onProgress)
      if (!completed) throw new Error("Generation failed or interrupted")

      const history = await this.getHistory(promptId)
      const outputs = history[promptId].outputs

      const results: ArrayBuffer[] = []

      for (const nodeId in outputs) {
        const nodeOutput = outputs[nodeId]
        if (nodeOutput.images) {
          for (const image of nodeOutput.images) {
            const imageData = await this.getImage(
              image.filename,
              image.subfolder,
              image.type,
            )
            if (imageData) {
              results.push(imageData)
            }
          }
        }
      }
      return results
    } catch (error) {
      return []
    } finally {
      await this.disconnect()
    }
  }
}
