/**
 * Utilities for exporting graphs as SVG files
 */

import { GraphData, ExportConfig } from './graphTypes';

/**
 * Export the graph as an SVG file
 * @param svgElement The SVG element to export
 * @param filename The desired filename
 */
export function exportSVG(svgElement: SVGSVGElement, filename = 'graph.svg'): void {
  // Clone the SVG element to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Get the SVG's bounding box to set proper viewBox
  const bbox = svgElement.getBBox();
  const padding = 20; // Add padding around the graph
  
  // Set viewBox to encompass all content
  clonedSvg.setAttribute('viewBox', 
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + 2 * padding} ${bbox.height + 2 * padding}`
  );
  
  // Set proper width and height
  clonedSvg.setAttribute('width', `${bbox.width + 2 * padding}`);
  clonedSvg.setAttribute('height', `${bbox.height + 2 * padding}`);
  
  // Add XML namespace if not present
  if (!clonedSvg.hasAttribute('xmlns')) {
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  
  // Serialize the SVG
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);
  
  // Create a blob and download
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generate a standalone SVG string from graph data
 * This can be used for server-side rendering or embedding
 */
export function generateSVGString(
  graphData: GraphData,
  width: number,
  height: number,
  backgroundColor = '#eeeeee'
): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <!-- Graph content would be rendered here -->
</svg>`;
  
  return svg;
}

/**
 * Copy SVG to clipboard as text
 */
export async function copySVGToClipboard(svgElement: SVGSVGElement): Promise<void> {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  
  try {
    await navigator.clipboard.writeText(svgString);
  } catch (err) {
    console.error('Failed to copy SVG to clipboard:', err);
    throw err;
  }
}

/**
 * Export as PNG (converts SVG to PNG using canvas)
 */
export function exportPNG(
  svgElement: SVGSVGElement,
  filename = 'graph.png',
  scale = 2 // Higher scale for better quality
): void {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }
  
  const img = new Image();
  
  img.onload = () => {
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  
  img.onerror = (err) => {
    console.error('Failed to load SVG image:', err);
  };
  
  // Convert SVG to data URL
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  img.src = url;
}

