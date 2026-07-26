'use client';

import {useLayoutEffect, useRef, type CSSProperties} from 'react';
import type {SvgPageData} from './svg-page';

type Props = {
  page: SvgPageData;
  className?: string;
  style?: CSSProperties;
};

export function SvgContent({page, className, style}: Props) {
  if (page.domTemplate) {
    return (
      <CachedDomContent
        template={page.domTemplate}
        className={className}
        style={style}
      />
    );
  }

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{__html: page.markup ?? ''}}
    />
  );
}

function CachedDomContent({
  template,
  className,
  style,
}: {
  template: SVGSVGElement;
  className?: string;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const displayedNode = template.cloneNode(true);
    container.replaceChildren(displayedNode);
    return () => {
      if (displayedNode.parentNode === container) {
        container.removeChild(displayedNode);
      }
    };
  }, [template]);

  return <div ref={containerRef} className={className} style={style} />;
}
