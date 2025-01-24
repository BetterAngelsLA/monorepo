declare module 'html2pdf.js' {
  function html2pdf(element: HTMLElement, options?: any): Promise<Blob>;
  export default html2pdf;
}
