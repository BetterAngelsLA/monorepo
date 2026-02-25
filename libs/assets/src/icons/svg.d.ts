declare module '*.svg?react' {
  import * as React from 'react';
  const C: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export default C;
}
