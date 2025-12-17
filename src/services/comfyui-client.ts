
import WebSocket from 'ws'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'
import path from 'path'

export class ComfyUiClient {
    private serverAddress: string
    private clientId: string
    private ws: WebSocket | null = null

    constructor(serverAddress: string = process.env.COMFYUI_API_URL || "127.0.0.1:8188") {
        this.serverAddress = serverAddress
        this.clientId = randomUUID()
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                resolve()
                return
            }

            this.ws = new WebSocket(`ws://${this.serverAddress}/ws?clientId=${this.clientId}`)

            this.ws.on('open', () => {
                resolve()
            })

            this.ws.on('error', (err) => {
                console.error("WebSocket connection error:", err)
                reject(err)
            })
        })
    }

    async disconnect(): Promise<void> {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }

    async loadWorkflow(workflowPath: string): Promise<any> {
        try {
            const data = await fs.readFile(workflowPath, 'utf-8')
            return JSON.parse(data)
        } catch (error) {
            console.error(`Error loading workflow from ${workflowPath}:`, error)
            return null
        }
    }

    async queuePrompt(workflow: any): Promise<{ prompt_id: string } | null> {
        const data = {
            prompt: workflow,
            client_id: this.clientId
        };

        try {
            const response = await fetch(`http://${this.serverAddress}/prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            return await response.json() as { prompt_id: string }
        } catch (error) {
            console.error("Error queueing prompt:", error);
            return null;
        }
    }

    async getHistory(promptId: string): Promise<any> {
        try {
            const response = await fetch(`http://${this.serverAddress}/history/${promptId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error getting history:", error);
            return null;
        }
    }

    async getImage(filename: string, subfolder: string, folderType: string): Promise<ArrayBuffer | null> {
        const params = new URLSearchParams({
            filename,
            subfolder,
            type: folderType
        });

        try {
            const response = await fetch(`http://${this.serverAddress}/view?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.arrayBuffer();
        } catch (error) {
            console.error("Error getting image:", error);
            return null;
        }
    }

    async uploadImage(file: string, filename: string = 'image.jpg', folderType: string = "input", overwrite: boolean = false): Promise<any> {
        try {
            let blob: Blob;

            // Check if file is a Data URI
            if (file.startsWith('data:')) {
                const response = await fetch(file);
                blob = await response.blob();
            } else {
                // Assume it's a raw string or binary buffer if not data uri (fallback)
                blob = new Blob([file]);
            }
            const formData = new FormData();
            formData.append('image', blob, filename);
            formData.append('type', folderType);
            formData.append('overwrite', String(overwrite).toLowerCase());

            const response = await fetch(`http://${this.serverAddress}/upload/image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    }

    updateWorkflow(workflow: any, positivePrompt: string): any {
        const idToClassType: Record<string, string> = {};
        for (const [id, details] of Object.entries(workflow) as [string, any][]) {
            idToClassType[id] = details.class_type;
        }

        const kSamplerId = Object.keys(idToClassType).find(key => idToClassType[key] === 'KSampler');

        if (kSamplerId) {
            // Set random seed
            const seed = Math.floor(Math.random() * (10 ** 15 - 10 ** 14) + 10 ** 14);
            workflow[kSamplerId].inputs.seed = seed;

            // Update positive prompt
            const textPromptId = workflow[kSamplerId].inputs.positive[0];
            if (workflow[textPromptId]) {
                workflow[textPromptId].inputs.text = positivePrompt;
            }
        }

        return workflow;
    }

    updateWorkflowImg(workflow: any, inputPath: string, positivePrompt: string): any {
        // First update generic parts
        this.updateWorkflow(workflow, positivePrompt);

        const idToClassType: Record<string, string> = {};
        for (const [id, details] of Object.entries(workflow) as [string, any][]) {
            idToClassType[id] = details.class_type;
        }

        // Update the path to the input image
        const imageLoaderId = Object.keys(idToClassType).find(key => idToClassType[key] === "LoadImage");
        if (imageLoaderId) {
            const filename = path.basename(inputPath);
            workflow[imageLoaderId].inputs.image = filename;
        }

        return workflow;
    }

    async trackProgress(promptId: string): Promise<boolean> {
        if (!this.ws) {
            console.error("WebSocket not connected");
            return false;
        }

        return new Promise((resolve, reject) => {
            const handleMessage = (data: WebSocket.RawData, isBinary: boolean) => {
                try {
                    const message = isBinary ? JSON.parse(data.toString()) : JSON.parse(String(data));

                    if (message.type === 'progress') {
                        console.log(`Progress: ${message.data.value}/${message.data.max}`);
                    } else if (message.type === 'executing') {
                        console.log(`Executing node: ${message.data.node}`);
                    } else if (message.type === 'execution_cached') {
                        console.log(`Cached execution: ${JSON.stringify(message.data)}`);
                    }

                    if (message.type === 'executed' && message.data.prompt_id === promptId) {
                        console.log("Generation completed");
                        this.ws?.off('message', handleMessage);
                        resolve(true);
                    }
                } catch (error) {
                    console.error("Error processing message:", error);
                    // We don't necessarily reject here to keep listening, but if critical...
                }
            };

            this.ws?.on('message', handleMessage);

            // Optional: timeout
            // setTimeout(() => {
            //    this.ws?.off('message', handleMessage);
            //    resolve(false);
            // }, 300000); // 5 minutes timeout
        });
    }

    async generateImage(generationParameters: { positive_prompt: string; input_path?: string; workflow_path?: string }): Promise<ArrayBuffer[]> {
        try {
            if (!this.ws) {
                await this.connect()
            }

            const workflowPath = generationParameters.workflow_path || "src/workflows/z-image-turbo.json";
            let workflow = await this.loadWorkflow(workflowPath);
            if (!workflow) throw new Error("Workflow not found");

            workflow = this.updateWorkflow(workflow, generationParameters.positive_prompt);

            const promptResponse = await this.queuePrompt(workflow);
            if (!promptResponse) throw new Error("Failed to queue prompt");

            const promptId = promptResponse.prompt_id;

            const completed = await this.trackProgress(promptId);
            if (!completed) throw new Error("Generation failed or interrupted");

            const history = await this.getHistory(promptId);
            const outputs = history[promptId].outputs;

            const results: ArrayBuffer[] = [];

            for (const nodeId in outputs) {
                const nodeOutput = outputs[nodeId];
                if (nodeOutput.images) {
                    for (const image of nodeOutput.images) {
                        const imageData = await this.getImage(image.filename, image.subfolder, image.type);
                        if (imageData) {
                            results.push(imageData);
                            const buffer = Buffer.from(imageData);
                            await fs.writeFile(`src/examples/${image.filename}`, buffer);
                        }
                    }
                }
            }
            return results;

        } catch (error) {
            console.error("Error in generateImage:", error);
            return [];
        } finally {
            await this.disconnect();
        }
    }

    async generateImage2Image(generationParameters: { positive_prompt: string; referenceImage?: string; workflow_path?: string }): Promise<ArrayBuffer[]> {
        try {
            if (!this.ws) {
                await this.connect()
            }

            const workflowPath = generationParameters.workflow_path || "src/workflows/z-image-turbo.json";
            let workflow = await this.loadWorkflow(workflowPath);
            if (!workflow) throw new Error("Workflow not found");

            if (!generationParameters.referenceImage) {
                console.log("No reference image provided");
                workflow = this.updateWorkflow(workflow, generationParameters.positive_prompt)
                return []
            }

            // Upload image first
            await this.uploadImage(generationParameters.referenceImage);
            workflow = this.updateWorkflowImg(workflow, generationParameters.referenceImage, generationParameters.positive_prompt);

            const promptResponse = await this.queuePrompt(workflow);
            if (!promptResponse) throw new Error("Failed to queue prompt");

            const promptId = promptResponse.prompt_id;

            const completed = await this.trackProgress(promptId);
            if (!completed) throw new Error("Generation failed or interrupted");

            const history = await this.getHistory(promptId);
            const outputs = history[promptId].outputs;

            const results: ArrayBuffer[] = [];

            for (const nodeId in outputs) {
                const nodeOutput = outputs[nodeId];
                if (nodeOutput.images) {
                    for (const image of nodeOutput.images) {
                        const imageData = await this.getImage(image.filename, image.subfolder, image.type);
                        if (imageData) {
                            results.push(imageData);
                        }
                    }
                }
            }

            return results;

        } catch (error) {
            console.error("Error in generateImage:", error);
            return [];
        } finally {
            await this.disconnect();
        }
    }

    async generateVideo(generationParameters: { positive_prompt: string; input_path?: string; workflow_path?: string }): Promise<ArrayBuffer[]> {
        return [];
    }
}
