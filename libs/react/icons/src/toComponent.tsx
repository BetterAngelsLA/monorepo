/**
 * Generates a React component from an SVG string.
 * @param svgContent - The raw SVG string content.
 * @returns A React component for the SVG.
 */

import { FC, SVGProps, createElement } from 'react';

type SvgProps = SVGProps<SVGSVGElement>;

export function createSvgComponent(svgContent: string): FC<SvgProps> {
  return function SvgComponent(props: SvgProps) {
    const parser = new DOMParser();
    let svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

    let svgElement = svgDoc.querySelector('svg');

    if (!svgElement) {
      svgDoc = parser.parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`,
        'image/svg+xml'
      );

      svgElement = svgDoc.querySelector('svg');

      if (!svgElement) {
        throw new Error('Invalid SVG content');
      }
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
