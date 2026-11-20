const BUNDLED_IMAGE_MODULES = import.meta.glob('../assets/images/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const IMAGE_BY_FILENAME: Record<string, string> = {};

for (const [modulePath, assetUrl] of Object.entries(BUNDLED_IMAGE_MODULES)) {
  const filename = modulePath.split('/').pop();
  if (filename) {
    IMAGE_BY_FILENAME[filename] = assetUrl;
  }
}

export function getBundledImage(filename: string): string {
  return IMAGE_BY_FILENAME[filename] || `/src/assets/images/${filename}`;
}

/**
 * Resolves stored paths like "/src/assets/images/foo.jpg" (from backend JSON DBs
 * or CMS records) into Vite-bundled URLs so images load reliably in both dev
 * and production ("dist") builds.
 */
export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const match = trimmed.match(/^(?:\/?src\/)?assets\/images\/([^?#]+)$/i);
  if (match && match[1]) {
    const resolved = IMAGE_BY_FILENAME[match[1]];
    if (resolved) return resolved;
  }

  return trimmed;
}
