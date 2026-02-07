type ProgressListener = (value: number, max: number) => void

/**
 * In-memory store for progress updates during image/video generation.
 * Allows components to subscribe to progress changes for specific scene IDs.
 */
class ProgressStore {
  private listeners: Map<string, Set<ProgressListener>> = new Map()

  /**
   * Subscribes to progress updates for a specific scene.
   * @param sceneId - The scene ID to listen for
   * @param listener - Callback function receiving value and max
   * @returns Unsubscribe function
   */
  subscribe(sceneId: string, listener: ProgressListener): () => void {
    if (!this.listeners.has(sceneId)) {
      this.listeners.set(sceneId, new Set())
    }
    this.listeners.get(sceneId)!.add(listener)

    return () => {
      this.listeners.get(sceneId)?.delete(listener)
      if (this.listeners.get(sceneId)?.size === 0) {
        this.listeners.delete(sceneId)
      }
    }
  }

  /**
   * Emits a progress update to all listeners for a scene.
   * @param sceneId - The scene ID to emit progress for
   * @param value - Current progress value
   * @param max - Maximum progress value
   */
  emit(sceneId: string, value: number, max: number): void {
    this.listeners.get(sceneId)?.forEach((listener) => {
      listener(value, max)
    })
  }
}

export const progressStore = new ProgressStore()
