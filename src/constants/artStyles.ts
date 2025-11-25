export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  previewColor: string;
  iconName: string;
}

export const ART_STYLES: ArtStyle[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon lights, futuristic tech, high contrast.',
    promptModifier: 'cyberpunk style, neon lighting, futuristic city background, high tech visor, chromatic aberration, detailed, digital art',
    previewColor: 'bg-purple-600',
    iconName: 'Zap'
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft edges, pastel colors, artistic flow.',
    promptModifier: 'watercolor painting style, soft brush strokes, pastel colors, artistic, dreamy, wet on wet technique, white background',
    previewColor: 'bg-pink-400',
    iconName: 'Palette'
  },
  {
    id: 'pixel',
    name: 'Pixel Art',
    description: 'Retro 8-bit gaming aesthetic.',
    promptModifier: 'pixel art style, 8-bit, retro game character, limited color palette, blocky, sharp edges',
    previewColor: 'bg-green-500',
    iconName: 'Grid'
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese animation style, expressive eyes.',
    promptModifier: 'anime style, studio ghibli inspired, vibrant colors, detailed eyes, cel shading, expressive',
    previewColor: 'bg-blue-500',
    iconName: 'Sparkles'
  },
  {
    id: 'oil',
    name: 'Oil Painting',
    description: 'Classic textured canvas look.',
    promptModifier: 'classic oil painting style, textured brushwork, canvas texture, impasto, fine art, museum quality, rembrandt lighting',
    previewColor: 'bg-yellow-700',
    iconName: 'Brush'
  },
  {
    id: '3d',
    name: '3D Render',
    description: 'Pixar-like 3D character design.',
    promptModifier: '3d render style, pixar style, cgsociety, octane render, soft lighting, cute, stylized, volumetric lighting',
    previewColor: 'bg-orange-500',
    iconName: 'Box'
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    description: 'Black and white hand-drawn look.',
    promptModifier: 'pencil sketch style, graphite, charcoal, rough lines, shading, monochrome, hand drawn, sketchbook',
    previewColor: 'bg-gray-600',
    iconName: 'PenTool'
  },
  {
    id: 'popart',
    name: 'Pop Art',
    description: 'Andy Warhol style, bold colors.',
    promptModifier: 'pop art style, andy warhol, comic book dots, bold outlines, vibrant contrasting colors, halftone pattern',
    previewColor: 'bg-red-500',
    iconName: 'Star'
  }
];

