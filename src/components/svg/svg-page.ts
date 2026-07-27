'use client';

export type SvgPageData = {
  markup: string | null;
  domTemplate: SVGSVGElement | null;
  width: number;
  height: number;
};

const DOM_CACHE_PARSE_THRESHOLD_MS = 8;
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
  const queryIndex = baseUrl.indexOf('?');
  const path = queryIndex === -1 ? baseUrl : baseUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : baseUrl.slice(queryIndex);
  return `${path}/${Math.max(0, page)}${query}`;
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
      const parseStartedAt = performance.now();
      const documentNode = new DOMParser().parseFromString(
        markup,
        'image/svg+xml',
      );
      const parseDurationMs = performance.now() - parseStartedAt;
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
        markup: parseDurationMs >= DOM_CACHE_PARSE_THRESHOLD_MS ? null : markup,
        domTemplate:
          parseDurationMs >= DOM_CACHE_PARSE_THRESHOLD_MS
            ? (document.importNode(svg, true) as unknown as SVGSVGElement)
            : null,
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
