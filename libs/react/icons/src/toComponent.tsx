/**
 * Generates a React component from an SVG string.
 * @param svgContent - The raw SVG string content.
 * @returns A React component for the SVG.
 */

import React, { FC, createElement } from 'react';

type SvgProps = React.SVGProps<SVGSVGElement>;

export function createSvgComponent(svgContent: string): FC<SvgProps> {
  return function SvgComponent(props: SvgProps) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

    const svgElement = svgDoc.querySelector('svg');

    if (!svgElement) {
      throw new Error('Invalid SVG content');
    }

    const svgProps = {
      ...props,
      dangerouslySetInnerHTML: { __html: svgElement.innerHTML },
    };

    return createElement('svg', {
      ...svgProps,
      xmlns: svgElement.getAttribute('xmlns') || 'http://www.w3.org/2000/svg',
      viewBox: svgElement.getAttribute('viewBox') || undefined,
    });
  };
}
