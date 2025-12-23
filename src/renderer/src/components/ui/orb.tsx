import { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Sphere, Camera, Mat3, Mat4 } from 'ogl'

const vert = /* glsl */ `
    precision highp float;
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    uniform float uBreath;
    uniform float uTime;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;

    void main() {
      // Breathing effect - expand/contract based on breath and normal
      vec3 pos = position + normal * uBreath * 0.15;

      vNormal = normalize(normalMatrix * normal);
      vPosition = pos;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;

      gl_Position = projectionMatrix * mvPosition;
    }
  `

const frag = /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uHue;
    uniform float uHover;
    uniform float uHoverIntensity;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;

    #define PI 3.14159265359

    // HSV to RGB conversion
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    // 3D Simplex Noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    // Fractal Brownian Motion for more detail
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Base colors with hue adjustment
      vec3 color1 = hsv2rgb(vec3(mod(0.7 + uHue / 360.0, 1.0), 0.8, 0.9));
      vec3 color2 = hsv2rgb(vec3(mod(0.55 + uHue / 360.0, 1.0), 0.7, 1.0));
      vec3 color3 = hsv2rgb(vec3(mod(0.4 + uHue / 360.0, 1.0), 0.9, 0.3));

      // Animated noise pattern
      float noiseValue = fbm(vPosition * 2.0 + uTime * 0.3);
      noiseValue = noiseValue * 0.5 + 0.5;

      // Create flowing energy pattern
      float energyPattern = snoise(vPosition * 3.0 + vec3(0.0, uTime * 0.5, 0.0));
      energyPattern = energyPattern * 0.5 + 0.5;

      // Fresnel effect for 3D depth
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);

      // Rim lighting
      vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
      vec3 lightDir2 = normalize(vec3(-1.0, 0.5, -0.5));
      vec3 lightDir3 = normalize(vec3(0.0, -1.0, 0.5));

      float diff1 = max(dot(normal, lightDir1), 0.0);
      float diff2 = max(dot(normal, lightDir2), 0.0);
      float diff3 = max(dot(normal, lightDir3), 0.0);

      // Specular highlights
      vec3 halfDir1 = normalize(lightDir1 + viewDir);
      float spec1 = pow(max(dot(normal, halfDir1), 0.0), 32.0);

      vec3 halfDir2 = normalize(lightDir2 + viewDir);
      float spec2 = pow(max(dot(normal, halfDir2), 0.0), 16.0);

      // Combine colors based on position and noise
      vec3 baseColor = mix(color1, color2, noiseValue);
      baseColor = mix(baseColor, color3, energyPattern * 0.5);

      // Add hover glow effect
      float hoverGlow = uHover * uHoverIntensity;
      vec3 hoverColor = hsv2rgb(vec3(mod(0.8 + uHue / 360.0, 1.0), 1.0, 1.0));
      baseColor = mix(baseColor, hoverColor, hoverGlow * fresnel);

      // Apply lighting
      vec3 ambient = baseColor * 0.3;
      vec3 diffuse = baseColor * (diff1 * 0.5 + diff2 * 0.3 + diff3 * 0.2);
      vec3 specular = (color2 * spec1 + hoverColor * spec2 * hoverGlow) * 0.8;

      // Fresnel rim lighting
      vec3 rim = color2 * fresnel * 0.6;

      // Inner glow - simulates energy from within
      float innerGlow = pow(max(dot(normal, -viewDir), 0.0), 3.0);
      vec3 innerColor = color1 * innerGlow * 0.4;

      // Pulsing glow based on breath
      float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
      vec3 pulseColor = color2 * pulse * 0.2;

      // Combine all effects
      vec3 finalColor = ambient + diffuse + specular + rim + innerColor + pulseColor;

      // Add subtle animated glow layers
      float layer1 = snoise(vPosition * 5.0 + uTime * 0.2) * 0.5 + 0.5;
      float layer2 = snoise(vPosition * 8.0 - uTime * 0.3) * 0.5 + 0.5;
      finalColor += color1 * layer1 * layer2 * 0.15;

      // Vignette the edges for more 3D depth
      float vignette = smoothstep(0.0, 0.3, fresnel);
      finalColor *= vignette;

      // Tone mapping and gamma correction
      finalColor = finalColor / (finalColor + vec3(1.0));
      finalColor = pow(finalColor, vec3(1.0 / 2.2));

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `

interface OrbProps {
  hue?: number
  hoverIntensity?: number
  rotateOnHover?: boolean
  forceHoverState?: boolean
}

export default function Orb({
  hue = 0,
  hoverIntensity = 0.2,
  rotateOnHover = true,
  forceHoverState = false
}: OrbProps) {
  const ctnDom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ctnDom.current
    if (!container) return

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true
    })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    container.appendChild(gl.canvas)

    // Create camera for 3D perspective
    const camera = new Camera(gl, { fov: 45 })
    camera.position.set(0, 0, 3.5)

    // Model-view and normal matrices for shader
    const modelViewMatrix = new Mat4()
    const normalMatrix = new Mat3()
    const projectionMatrix = new Mat4()

    // Use Sphere geometry for true 3D orb
    const geometry = new Sphere(gl, {
      radius: 1,
      widthSegments: 64,
      heightSegments: 64
    })

    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        uTime: { value: 0 },
        uHue: { value: hue / 360 },
        uHover: { value: 0 },
        uHoverIntensity: { value: hoverIntensity },
        uBreath: { value: 0 },
        modelViewMatrix: { value: modelViewMatrix },
        projectionMatrix: { value: projectionMatrix },
        normalMatrix: { value: normalMatrix }
      },
      transparent: true
    })

    const mesh = new Mesh(gl, { geometry, program })

    function resize() {
      if (!container) return
      const dpr = window.devicePixelRatio || 1
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width * dpr, height * dpr)
      gl.canvas.style.width = width + 'px'
      gl.canvas.style.height = height + 'px'
      camera.perspective({ aspect: width / height })

      // Update projection matrix
      projectionMatrix.copy(camera.projectionMatrix)
    }
    window.addEventListener('resize', resize)
    resize()

    let targetHover = 0
    let currentHover = 0
    let currentRotX = 0
    let currentRotY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const width = rect.width
      const height = rect.height

      // Calculate normalized mouse position (-1 to 1)
      const nx = (x / width) * 2 - 1
      const ny = (y / height) * 2 - 1

      // Check if mouse is over the orb area
      if (Math.sqrt(nx * nx + ny * ny) < 0.7) {
        targetHover = 1
      } else {
        targetHover = 0
      }

      // Update target rotation based on mouse position
      if (rotateOnHover && targetHover > 0.5) {
        currentRotY = nx * 0.5
        currentRotX = -ny * 0.5
      }
    }

    const handleMouseLeave = () => {
      targetHover = 0
      currentRotX = 0
      currentRotY = 0
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    let rafId: number
    const update = (t: number) => {
      rafId = requestAnimationFrame(update)
      const time = t * 0.001

      // Smooth hover transition
      const effectiveHover = forceHoverState ? 1 : targetHover
      currentHover += (effectiveHover - currentHover) * 0.08

      // Breathing animation - smooth sine wave
      const breath = Math.sin(time * 1.5) * 0.5 + 0.5

      // Auto-rotate the orb slowly
      const autoRotation = time * 0.1

      // Update uniforms
      program.uniforms.uTime.value = time
      program.uniforms.uHue.value = hue / 360
      program.uniforms.uHover.value = currentHover
      program.uniforms.uHoverIntensity.value = hoverIntensity
      program.uniforms.uBreath.value = breath

      // Update mesh rotation
      mesh.rotation.y = autoRotation + currentRotY * currentHover
      mesh.rotation.x = currentRotX * currentHover

      // Update mesh matrix
      mesh.updateMatrix()

      // Update model-view matrix (camera view * mesh world)
      modelViewMatrix.copy(camera.viewMatrix).multiply(mesh.worldMatrix)

      // Update normal matrix - extract upper 3x3 and invert
      // For a sphere with uniform scaling, we can use the model-view directly
      const a = modelViewMatrix
      normalMatrix.set(a[0], a[1], a[2], a[4], a[5], a[6], a[8], a[9], a[10])
      // Invert the 3x3 matrix for normal transformation
      const det =
        normalMatrix[0] *
          (normalMatrix[4] * normalMatrix[8] -
            normalMatrix[5] * normalMatrix[7]) -
        normalMatrix[1] *
          (normalMatrix[3] * normalMatrix[8] -
            normalMatrix[5] * normalMatrix[6]) +
        normalMatrix[2] *
          (normalMatrix[3] * normalMatrix[7] -
            normalMatrix[4] * normalMatrix[6])
      const invDet = 1 / det
      const temp = new Mat3()
      temp.set(
        (normalMatrix[4] * normalMatrix[8] -
          normalMatrix[5] * normalMatrix[7]) *
          invDet,
        (normalMatrix[2] * normalMatrix[7] -
          normalMatrix[1] * normalMatrix[8]) *
          invDet,
        (normalMatrix[1] * normalMatrix[5] -
          normalMatrix[2] * normalMatrix[4]) *
          invDet,
        (normalMatrix[5] * normalMatrix[6] -
          normalMatrix[3] * normalMatrix[8]) *
          invDet,
        (normalMatrix[0] * normalMatrix[8] -
          normalMatrix[2] * normalMatrix[6]) *
          invDet,
        (normalMatrix[2] * normalMatrix[3] -
          normalMatrix[0] * normalMatrix[5]) *
          invDet,
        (normalMatrix[3] * normalMatrix[7] -
          normalMatrix[4] * normalMatrix[6]) *
          invDet,
        (normalMatrix[1] * normalMatrix[6] -
          normalMatrix[0] * normalMatrix[7]) *
          invDet,
        (normalMatrix[0] * normalMatrix[4] -
          normalMatrix[1] * normalMatrix[3]) *
          invDet
      )
      normalMatrix.copy(temp)

      renderer.render({ scene: mesh, camera })
    }
    rafId = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [hue, hoverIntensity, rotateOnHover, forceHoverState])

  return (
    <div
      ref={ctnDom}
      className='h-full w-full'
    />
  )
}
