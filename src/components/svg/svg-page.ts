'use client';

export type SvgPageData = {
  markup: string;
  width: number;
  height: number;
};

const cache = new Map<string, Promise<SvgPageData>>();
const resolvedCache = new Map<string, SvgPageData>();

function parseLength(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getSvgPageUrl(baseUrl: string, page: number) {
  return `${baseUrl}/${Math.max(0, page)}`;
}

export function getSvgPage(baseUrl: string, page: number) {
  const url = getSvgPageUrl(baseUrl, page);
  const cached = cache.get(url);
  if (cached) {
    return cached;
  }

  const promise = fetch(url, {cache: 'no-store'})
    .then(async response => {
      if (!response.ok) {
        throw new Error('SVG page not found');
      }
      const markup = await response.text();
      const documentNode = new DOMParser().parseFromString(
        markup,
        'image/svg+xml',
      );
      const svg = documentNode.documentElement;
      const viewBox = svg
        .getAttribute('viewBox')
        ?.trim()
        .split(/[\s,]+/)
        .map(Number);
      const width =
        viewBox?.length === 4 && Number.isFinite(viewBox[2])
          ? viewBox[2]
          : parseLength(svg.getAttribute('width'));
      const height =
        viewBox?.length === 4 && Number.isFinite(viewBox[3])
          ? viewBox[3]
          : parseLength(svg.getAttribute('height'));

      const result = {
        markup,
        width: width || 1,
        height: height || 1,
      };
      resolvedCache.set(url, result);
      return result;
    })
    .catch(error => {
      cache.delete(url);
      throw error;
    });

  cache.set(url, promise);
  return promise;
}

export function getCachedSvgPage(baseUrl: string, page: number) {
  return resolvedCache.get(getSvgPageUrl(baseUrl, page));
}

export async function preloadSvgPages(baseUrl: string, totalPages: number) {
  await Promise.allSettled(
    Array.from({length: totalPages}, (_, page) => getSvgPage(baseUrl, page)),
  );
}
