'use client';

import React from 'react';
import { exportSVG, exportPNG } from '../lib/svgExport';

interface ExportButtonProps {
  onExport?: () => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onExport }) => {
  const handleExportSVG = () => {
    const svgElement = (window as any).__graphSvgElement as SVGSVGElement;
    if (svgElement) {
      exportSVG(svgElement, 'graph.svg');
      if (onExport) onExport();
    } else {
      alert('SVG element not found. Please try again.');
    }
  };

  const handleExportPNG = () => {
    const svgElement = (window as any).__graphSvgElement as SVGSVGElement;
    if (svgElement) {
      exportPNG(svgElement, 'graph.png', 3); // 3x scale for high quality
      if (onExport) onExport();
    } else {
      alert('SVG element not found. Please try again.');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExportSVG}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Export as SVG
      </button>
      <button
        onClick={handleExportPNG}
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        Export as PNG
      </button>
    </div>
  );
};

