"use client"

import { useEffect, useRef } from "react"

interface Vector2D {
  x: number
  y: number
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 }
  vel: Vector2D = { x: 0, y: 0 }
  acc: Vector2D = { x: 0, y: 0 }
  target: Vector2D = { x: 0, y: 0 }

  closeEnoughTarget = 100
  maxSpeed = 1.0
  maxForce = 0.1
  particleSize = 10
  isKilled = false

  startColor = { r: 0, g: 0, b: 0 }
  targetColor = { r: 0, g: 0, b: 0 }
  colorWeight = 0
  colorBlendRate = 0.01

  move() {
    let proximityMult = 1
    const distance = Math.sqrt(Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2))

    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget
    }

    // Add force towards target
    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    }

    const magnitude = Math.sqrt(towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y)
    if (magnitude > 0) {
      towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult
      towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult
    }

    const steer = {
      x: towardsTarget.x - this.vel.x,
      y: towardsTarget.y - this.vel.y,
    }

    const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y)
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce
      steer.y = (steer.y / steerMagnitude) * this.maxForce
    }

    this.acc.x += steer.x
    this.acc.y += steer.y

    // Move particle
    this.vel.x += this.acc.x
    this.vel.y += this.acc.y
    this.pos.x += this.vel.x
    this.pos.y += this.vel.y
    this.acc.x = 0
    this.acc.y = 0
  }

  draw(ctx: CanvasRenderingContext2D, drawAsPoints: boolean) {
    // Blend towards target color
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0)
    }

    // Calculate current color
    const currentColor = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    }

    if (drawAsPoints) {
      ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2)
    } else {
      ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`
      ctx.beginPath()
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  kill(width: number, height: number) {
    if (!this.isKilled) {
      // Generate random angle from 0 to 2π (full circle)
      const angle = Math.random() * Math.PI * 2
      const mag = (width + height) / 2

      // Calculate position on circle perimeter at distance 'mag' from center
      const centerX = width / 2
      const centerY = height / 2
      const exitX = centerX + Math.cos(angle) * mag
      const exitY = centerY + Math.sin(angle) * mag

      this.target.x = exitX
      this.target.y = exitY

      // Begin blending color to black
      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      }
      this.targetColor = { r: 0, g: 0, b: 0 }
      this.colorWeight = 0

      this.isKilled = true
    }
  }
}

interface ParticleTextEffectProps {
  words?: string[]
}

const DEFAULT_WORDS = ["ONSTREAM", "BUY NOW", "PAY LATER", "TRUST SCORE", "WEB3 CREDIT"]

export function ParticleTextEffect({
  words = DEFAULT_WORDS
}: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameCountRef = useRef(0)
  const wordIndexRef = useRef(0)

  const drawAsPoints = true

  // Pink / Lavender / Blue palette for particles
  const colors = [
    { r: 255, g: 182, b: 193 },   // Baby Pink #ffb6c1
    { r: 232, g: 145, b: 160 },   // Deep Pink #e891a0
    { r: 200, g: 180, b: 232 },   // Lavender #c8b4e8
    { r: 155, g: 125, b: 200 },   // Deep Lavender #9b7dc8
    { r: 126, g: 184, b: 212 },   // Azure #7eb8d4
    { r: 74, g: 144, b: 184 },   // Deep Azure #4a90b8
    { r: 230, g: 210, b: 250 },   // Light Lavender #e6d2fa
    { r: 255, g: 214, b: 222 },   // Light Pink #ffd6de
  ]

  const generateRandomPos = (
    x: number,
    y: number,
    mag: number
  ): Vector2D => {
    // Generate random angle from 0 to 2π (full circle)
    const angle = Math.random() * Math.PI * 2

    // Calculate position on circle perimeter at distance 'mag' from center
    const startX = x + Math.cos(angle) * mag
    const startY = y + Math.sin(angle) * mag

    return {
      x: startX,
      y: startY,
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    const performAnimate = () => {
      const ctx = canvas.getContext("2d")!
      const particles = particlesRef.current

      // Semi-transparent background with subtle gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(9, 9, 11, 0.3)')
      gradient.addColorStop(1, 'rgba(9, 9, 11, 0.1)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        particle.move()
        particle.draw(ctx, drawAsPoints)

        // Remove dead particles that are out of bounds
        if (particle.isKilled) {
          if (
            particle.pos.x < 0 ||
            particle.pos.x > canvas.width ||
            particle.pos.y < 0 ||
            particle.pos.y > canvas.height
          ) {
            particles.splice(i, 1)
          }
        }
      }

      // Auto-advance words
      frameCountRef.current++
      if (frameCountRef.current % 180 === 0) {
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length
        performNextWord(words[wordIndexRef.current], canvas)
      }

      animationRef.current = requestAnimationFrame(performAnimate)
    }

    const performNextWord = (word: string, canv: HTMLCanvasElement) => {
      // Create off-screen canvas for text rendering
      const offscreenCanvas = document.createElement("canvas")
      offscreenCanvas.width = canv.width
      offscreenCanvas.height = canv.height
      const offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true })!

      // Clear canvas with transparent background
      offscreenCtx.clearRect(0, 0, canv.width, canv.height)

      // Calculate responsive font size based on canvas dimensions
      const baseFontSize = Math.min(canv.width, canv.height) * 0.2

      // Use red-purple gradient colors for text
      const textColors = [
        { fill: "#FF1744", stroke: "#9C27B0" },  // Red & Purple
        { fill: "#E91E63", stroke: "#7B1FA2" },  // Pink & Dark Purple
        { fill: "#FF5722", stroke: "#6A1B9A" }   // Deep Orange & Deep Purple
      ]
      const selectedTextColor = textColors[Math.floor(Math.random() * textColors.length)]

      // Draw text with stroke and fill for better visibility
      offscreenCtx.fillStyle = selectedTextColor.fill
      offscreenCtx.strokeStyle = selectedTextColor.stroke
      offscreenCtx.lineWidth = 4
      offscreenCtx.font = `bold ${baseFontSize}px Arial, sans-serif`
      offscreenCtx.textAlign = "center"
      offscreenCtx.textBaseline = "middle"

      const centerX = canv.width / 2
      const centerY = canv.height / 2

      // Draw stroke first, then fill
      offscreenCtx.strokeText(word, centerX, centerY)
      offscreenCtx.fillText(word, centerX, centerY)

      const imageData = offscreenCtx.getImageData(0, 0, canv.width, canv.height)
      const pixels = imageData.data

      // Generate random color from OnStream palette
      const color = colors[Math.floor(Math.random() * colors.length)]
      const newColor = {
        r: color.r,
        g: color.g,
        b: color.b,
      }

      const particles = particlesRef.current
      let particleIndex = 0

      // Collect coordinates - use finer step for better text detection
      const coordsIndexes: number[] = []
      for (let i = 0; i < pixels.length; i += 4) {
        coordsIndexes.push(i)
      }

      // Shuffle coordinates for fluid motion
      for (let i = coordsIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
          ;[coordsIndexes[i], coordsIndexes[j]] = [coordsIndexes[j], coordsIndexes[i]]
      }

      for (const coordIndex of coordsIndexes) {
        const pixelIndex = coordIndex
        const alpha = pixels[pixelIndex + 3]
        const red = pixels[pixelIndex]
        const green = pixels[pixelIndex + 1]
        const blue = pixels[pixelIndex + 2]

        // Check if pixel is part of the text (white or near-white with decent alpha)
        if (alpha > 50 && (red > 200 || green > 200 || blue > 200)) {
          const x = (pixelIndex / 4) % canv.width
          const y = Math.floor(pixelIndex / 4 / canv.width)

          let particle: Particle

          if (particleIndex < particles.length) {
            particle = particles[particleIndex]
            particle.isKilled = false
            particleIndex++
          } else {
            particle = new Particle()

            const randomPos = generateRandomPos(
              canv.width / 2,
              canv.height / 2,
              (canv.width + canv.height) / 2
            )
            particle.pos.x = randomPos.x
            particle.pos.y = randomPos.y

            particle.maxSpeed = Math.random() * 10 + 8
            particle.maxForce = particle.maxSpeed * 0.08
            particle.particleSize = Math.random() * 6 + 6
            particle.colorBlendRate = Math.random() * 0.0375 + 0.015

            particles.push(particle)
          }

          // Set color transition
          particle.startColor = {
            r: particle.startColor.r + (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
            g: particle.startColor.g + (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
            b: particle.startColor.b + (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
          }
          particle.targetColor = newColor
          particle.colorWeight = 0

          particle.target.x = x
          particle.target.y = y
        }
      }

      // Kill remaining particles
      for (let i = particleIndex; i < particles.length; i++) {
        particles[i].kill(canv.width, canv.height)
      }
    }

    // Initial resize
    resizeCanvas()

    // Initialize with first word
    performNextWord(words[0], canvas)

    // Start animation
    performAnimate()

    const handleResize = () => {
      resizeCanvas()
      // Reinitialize particles with new dimensions
      performNextWord(words[wordIndexRef.current], canvas)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ display: 'block' }}
    />
  )
}
