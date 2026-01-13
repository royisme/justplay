/**
 * @file PixiBackground.tsx
 * @description Immersive PixiJS background with theme-based particle effects.
 * Creates atmospheric visual effects for different story genres.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { Application, extend, useApplication, useTick } from "@pixi/react";
import { Container, Graphics } from "pixi.js";

// Extend PixiJS components for React
extend({ Container, Graphics });

// Particle configuration by theme
const THEME_CONFIGS: Record<string, ParticleConfig> = {
  xuanhuan: {
    color: 0xffd700,
    particleCount: 50,
    speed: 0.3,
    size: { min: 2, max: 6 },
    opacity: { min: 0.2, max: 0.6 },
    drift: true,
  },
  cyberpunk: {
    color: 0x00ffff,
    secondaryColor: 0xff00ff,
    particleCount: 80,
    speed: 1.5,
    size: { min: 1, max: 3 },
    opacity: { min: 0.3, max: 0.8 },
    drift: false,
    rain: true,
  },
  magic: {
    color: 0x9966ff,
    particleCount: 40,
    speed: 0.5,
    size: { min: 3, max: 8 },
    opacity: { min: 0.3, max: 0.7 },
    drift: true,
    sparkle: true,
  },
  mystery: {
    color: 0x666666,
    particleCount: 30,
    speed: 0.2,
    size: { min: 20, max: 60 },
    opacity: { min: 0.05, max: 0.15 },
    drift: true,
  },
  scifi: {
    color: 0x00ff88,
    particleCount: 60,
    speed: 0.8,
    size: { min: 1, max: 4 },
    opacity: { min: 0.2, max: 0.5 },
    drift: false,
    dust: true,
  },
  default: {
    color: 0xffffff,
    particleCount: 30,
    speed: 0.2,
    size: { min: 2, max: 5 },
    opacity: { min: 0.1, max: 0.3 },
    drift: true,
  },
};

interface ParticleConfig {
  color: number;
  secondaryColor?: number;
  particleCount: number;
  speed: number;
  size: { min: number; max: number };
  opacity: { min: number; max: number };
  drift: boolean;
  rain?: boolean;
  sparkle?: boolean;
  dust?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  targetOpacity: number;
  color: number;
  life: number;
  maxLife: number;
}

interface ParticleLayerProps {
  config: ParticleConfig;
  width: number;
  height: number;
}

function ParticleLayer({ config, width, height }: ParticleLayerProps) {
  const particlesRef = useRef<Particle[]>([]);
  const graphicsRef = useRef<Graphics | null>(null);

  // Initialize particles
  useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(createParticle(config, width, height));
    }
    particlesRef.current = particles;
  }, [config, width, height]);

  // Animation tick
  useTick((ticker) => {
    if (!graphicsRef.current) return;

    const graphics = graphicsRef.current;
    const delta = ticker.deltaTime;

    graphics.clear();

    particlesRef.current.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;

      // Drift effect
      if (config.drift) {
        particle.x += Math.sin(particle.life * 0.02) * 0.5 * delta;
      }

      // Fade in/out
      particle.life += delta;
      const lifeRatio = particle.life / particle.maxLife;
      if (lifeRatio < 0.2) {
        particle.opacity = particle.targetOpacity * (lifeRatio / 0.2);
      } else if (lifeRatio > 0.8) {
        particle.opacity =
          particle.targetOpacity * (1 - (lifeRatio - 0.8) / 0.2);
      }

      // Reset if out of bounds or life ended
      if (
        particle.x < -50 ||
        particle.x > width + 50 ||
        particle.y < -50 ||
        particle.y > height + 50 ||
        particle.life > particle.maxLife
      ) {
        particlesRef.current[index] = createParticle(
          config,
          width,
          height,
          true,
        );
        return;
      }

      // Draw particle
      graphics.circle(particle.x, particle.y, particle.size);
      graphics.fill({ color: particle.color, alpha: particle.opacity });
    });
  });

  const handleDraw = useCallback((g: Graphics) => {
    graphicsRef.current = g;
  }, []);

  return <pixiGraphics draw={handleDraw} />;
}

function createParticle(
  config: ParticleConfig,
  width: number,
  height: number,
  fromEdge = false,
): Particle {
  const size = random(config.size.min, config.size.max);
  const opacity = random(config.opacity.min, config.opacity.max);
  const color =
    config.secondaryColor && Math.random() > 0.5
      ? config.secondaryColor
      : config.color;

  let x: number, y: number, vx: number, vy: number;

  if (config.rain) {
    x = random(0, width);
    y = fromEdge ? -10 : random(-height, height);
    vx = random(-0.5, 0.5);
    vy = config.speed * random(2, 4);
  } else if (config.dust) {
    x = fromEdge ? -10 : random(0, width);
    y = random(0, height);
    vx = config.speed * random(0.5, 1.5);
    vy = random(-0.2, 0.2);
  } else {
    x = random(0, width);
    y = fromEdge ? height + 10 : random(0, height);
    vx = random(-0.3, 0.3) * config.speed;
    vy = -config.speed * random(0.5, 1.5);
  }

  return {
    x,
    y,
    vx,
    vy,
    size,
    opacity: 0,
    targetOpacity: opacity,
    color,
    life: 0,
    maxLife: random(200, 400),
  };
}

function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Background scene component
function BackgroundScene({ theme = "default" }: { theme: string }) {
  const { app } = useApplication();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (app?.renderer) {
      setDimensions({
        width: app.renderer.width,
        height: app.renderer.height,
      });
    }
  }, [app]);

  const config = THEME_CONFIGS[theme] || THEME_CONFIGS.default;

  return (
    <pixiContainer>
      <ParticleLayer
        config={config}
        width={dimensions.width}
        height={dimensions.height}
      />
    </pixiContainer>
  );
}

// Main background component
interface PixiBackgroundProps {
  theme?: string;
  className?: string;
}

export function PixiBackground({
  theme = "default",
  className = "",
}: PixiBackgroundProps) {
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <Application
        resizeTo={typeof window !== "undefined" ? window : undefined}
        backgroundAlpha={0}
        antialias
        autoDensity
        resolution={typeof window !== "undefined" ? window.devicePixelRatio : 1}
      >
        <BackgroundScene theme={theme} />
      </Application>
    </div>
  );
}

export default PixiBackground;
