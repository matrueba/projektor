'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createProject } from '@/app/actions'

export function CreateProjectForm() {
  const [isLoading, setIsLoading] = useState(false)

  const [activeHelp, setActiveHelp] = useState('')

  const fieldHelp: Record<string, string> = {
    name: 'Nombre del proyecto. Te ayudará a identificar este vídeo dentro de la aplicación.',
    theme: 'Describe la idea principal del vídeo para que el sistema pueda generar un concepto coherente.',
    style: 'Selecciona el estilo visual general que quieres para el vídeo.',
    sceneCount: 'Número de escenas que tendrá el vídeo.',
    maxDuration: 'Duración máxima total del vídeo, en segundos.',
    generationMode: 'Modo en que se generarán las escenas: todas a la vez o de forma secuencial.',
    constraints: 'Elementos que quieres evitar o limitar en el resultado (por ejemplo: sin texto en pantalla).'
  }
  const generationModeHelp: Record<'batch' | 'sequential', string> = {
    batch: 'Batch: Se genera el contenido en lote, más rápido pero menor capacidad de personalización.',
    sequential: 'Sequential: El contenido se genera secuencialmente. Permite un control total.'
  }

  function handleFieldEnter(field: keyof typeof fieldHelp) {
    setActiveHelp(fieldHelp[field])
  }

  function handleGenerationModeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as keyof typeof generationModeHelp
    setActiveHelp(generationModeHelp[value])
  }

  function handleGenerationModeFocus(event: React.FocusEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value as keyof typeof generationModeHelp
    setActiveHelp(generationModeHelp[value])
  }

  function handleGenerationModeMouseEnter(event: React.MouseEvent<HTMLSelectElement>) {
    const value = event.currentTarget.value as keyof typeof generationModeHelp
    setActiveHelp(generationModeHelp[value])
  }

  function clearHelp() {
    setActiveHelp('')
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    const projectName = formData.get('name') as string
    const theme = formData.get('theme') as string
    const style = formData.get('style') as string
    const constraints = formData.get('constraints') as string
    const sceneCount = parseInt(formData.get('sceneCount') as string, 10)
    const maxDuration = parseInt(formData.get('maxDuration') as string, 10)
    const generationMode = formData.get('generationMode') as 'batch' | 'sequential'

    await createProject({
      name: projectName,
      theme,
      style,
      constraints,
      sceneCount,
      maxDuration,
      generationMode
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl mx-auto p-6 border rounded-lg shadow-sm">
      <div className="space-y-2">

        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="My Awesome Video Project"
          onFocus={() => handleFieldEnter('name')}
          onBlur={clearHelp}
          onMouseEnter={() => handleFieldEnter('name')}
          onMouseLeave={clearHelp}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Video Idea / Theme</Label>
        <Textarea
          id="theme"
          name="theme"
          required
          placeholder="A commercial for a new futuristic running shoe..."
          className="h-32"
          onFocus={() => handleFieldEnter('theme')}
          onBlur={clearHelp}
          onMouseEnter={() => handleFieldEnter('theme')}
          onMouseLeave={clearHelp}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="style">Visual Style</Label>
          <div className="relative">
            <select
              id="style"
              name="style"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onFocus={() => handleFieldEnter('style')}
              onBlur={clearHelp}
              onMouseEnter={() => handleFieldEnter('style')}
              onMouseLeave={clearHelp}
            >
              <option value="cinematic">Cinematic</option>
              <option value="animated">Animated / Cartoon</option>
              <option value="realistic">Hyper Realistic</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="vintage">Vintage</option>
              <option value="custom">Custom Style</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sceneCount">Number of Scenes</Label>
          <Input
            id="sceneCount"
            name="sceneCount"
            type="number"
            min={1}
            max={10}
            defaultValue={3}
            onFocus={() => handleFieldEnter('sceneCount')}
            onBlur={clearHelp}
            onMouseEnter={() => handleFieldEnter('sceneCount')}
            onMouseLeave={clearHelp}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="style">Max duration</Label>
          <Input
            id="maxDuration"
            name="maxDuration"
            type="number"
            min={10}
            max={300}
            defaultValue={60}
            onFocus={() => handleFieldEnter('maxDuration')}
            onBlur={clearHelp}
            onMouseEnter={() => handleFieldEnter('maxDuration')}
            onMouseLeave={clearHelp}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="generationMode">Generation Mode</Label>
          <div className="relative">
            <select
              id="generationMode"
              name="generationMode"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onFocus={handleGenerationModeFocus}
              onChange={handleGenerationModeChange}
              onBlur={clearHelp}
              onMouseEnter={handleGenerationModeMouseEnter}
              onMouseLeave={clearHelp}
            >
              <option value="batch">Batch</option>
              <option value="sequential">Sequential</option>
            </select>
          </div>
        </div>
      </div>


      <div className="space-y-2">
        <Label htmlFor="constraints">Constraints / Negative Prompts</Label>
        <Textarea
          id="constraints"
          name="constraints"
          placeholder="No text on screen, no people, etc."
          onFocus={() => handleFieldEnter('constraints')}
          onBlur={clearHelp}
          onMouseEnter={() => handleFieldEnter('constraints')}
          onMouseLeave={clearHelp}
        />
      </div>

      <div className="text-xs text-muted-foreground min-h-[1.5rem]">
        {activeHelp || 'Pasa el ratón por encima de cada campo o selección para ver una descripción.'}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Generating Concept...' : 'Create Project'}
      </Button>
    </form>
  )
}
