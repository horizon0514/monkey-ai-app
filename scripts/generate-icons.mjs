#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const projectRoot = resolve(new URL('.', import.meta.url).pathname, '..', '..')
const svgPath = resolve(projectRoot, 'icons', 'chatmonkey.svg')
const outDir = resolve(projectRoot, 'build')

async function ensureDir(path) {
  try {
    await mkdir(path, { recursive: true })
  } catch {}
}

async function generate() {
  const svg = await readFile(svgPath)
  await ensureDir(outDir)

  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
  // Primary PNG used by electron-builder
  const mainPng = resolve(outDir, 'icon.png')
  await sharp(svg).resize(1024, 1024).png({ compressionLevel: 9 }).toFile(mainPng)

  // ICNS and ICO are optional here; electron-builder can generate from PNG.
  // But we also provide 1024 for other tooling if needed.
  const iconsetDir = resolve(projectRoot, 'icons', 'icon.iconset')
  await ensureDir(iconsetDir)
  for (const s of sizes) {
    const p = resolve(iconsetDir, `icon_${s}x${s}.png`)
    await sharp(svg).resize(s, s).png().toFile(p)
  }

  console.log('Icons generated:')
  console.log(`- ${mainPng}`)
  console.log(`- ${iconsetDir}/*.png`)
}

generate().catch((err) => {
  console.error(err)
  process.exit(1)
})

