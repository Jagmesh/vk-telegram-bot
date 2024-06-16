export function getVideoUrlFromPlainText(url: string): string | null {
  const pattern = /(?:https?:\/\/)?(?:www\.)?vk\.com\/(video|clip)(-?\d+_\d+)/;

  const match = url.match(pattern);
  if (!match || !match.length || !match[match.length - 1] || !/^[\d_-]+$/.test(match[match.length - 1])) return null;

  return match[match.length - 1];
}
