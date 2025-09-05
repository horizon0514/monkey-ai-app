export const COLOR_PALETTES = {
  default: { label: '默认' },
  ocean: { label: '海洋' }
} as const

export type ColorPaletteId = keyof typeof COLOR_PALETTES

export const getAllPalettes = () =>
  Object.entries(COLOR_PALETTES).map(([id, meta]) => ({
    id: id as ColorPaletteId,
    label: meta.label
  }))
