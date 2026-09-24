/** Base path for GitHub Pages project site (empty in local `next dev` without env). */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/** Prefix a site-relative path with the Next.js basePath. */
export function assetUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const base = getBasePath().replace(/\/$/, '');
  return base ? `${base}/${normalized}` : `/${normalized}`;
}
