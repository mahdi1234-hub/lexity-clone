export function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  const problematicPatterns = [
    'lookaside.instagram.com',
    'google_widget/crawler',
    '/seo/',
  ];
  if (problematicPatterns.some(pattern => url.includes(pattern))) {
    return false;
  }
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
