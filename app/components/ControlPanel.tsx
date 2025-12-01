'use client';

import React, { useState } from 'react';
import { GraphData, GraphConfig } from '../lib/graphTypes';
import { parseMermaidDiagram, autoLayoutGraph, EXAMPLE_MERMAID } from '../lib/mermaidParser';
import { ExportButton } from './ExportButton';

interface ControlPanelProps {
  graphData: GraphData;
  onGraphDataChange: (data: GraphData) => void;
  config: GraphConfig;
  onConfigChange: (config: GraphConfig) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  graphData,
  onGraphDataChange,
  config,
  onConfigChange,
}) => {
  const [mermaidInput, setMermaidInput] = useState(EXAMPLE_MERMAID);
  const [showInput, setShowInput] = useState(true);

  const handleParseMermaid = () => {
    try {
      const parseResult = parseMermaidDiagram(mermaidInput);
      const layoutResult = autoLayoutGraph(parseResult);
      
      // Convert to GraphData format
      const newNodes = layoutResult.nodes.map(node => ({
        id: node.id,
        label: node.label,
        x: node.x,
        y: node.y,
        shape: config.defaultNodeShape,
        color: config.defaultNodeColor,
        size: config.defaultNodeSize,
        opacity: 0.8,
      }));
      
      const newEdges = parseResult.edges.map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        color: config.defaultEdgeColor,
        width: config.defaultEdgeWidth,
        style: config.defaultEdgeStyle,
        opacity: 0.8,
        annotations: edge.label ? [{
          value: edge.label,
          position: 0.5,
          offset: 15,
        }] : [],
        controlPoints: [],
      }));
      
      onGraphDataChange({ nodes: newNodes, edges: newEdges });
      setShowInput(false);
    } catch (error) {
      alert('Error parsing Mermaid diagram: ' + (error as Error).message);
    }
  };

  const handleLoadExample = () => {
    setMermaidInput(EXAMPLE_MERMAID);
  };

  const handleClear = () => {
    onGraphDataChange({ nodes: [], edges: [] });
  };

  return (
    <div className="w-80 bg-gray-100 p-4 overflow-y-auto h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Graph Controls</h2>
      
      {/* Mermaid Input Section */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-700">Mermaid Input</h3>
          <button
            onClick={() => setShowInput(!showInput)}
            className="text-sm text-blue-600 hover:underline focus:outline-none"
          >
            {showInput ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showInput && (
          <>
            <textarea
              value={mermaidInput}
              onChange={(e) => setMermaidInput(e.target.value)}
              className="w-full h-40 p-2 border border-gray-300 rounded font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Mermaid diagram..."
            />
            <div className="mt-2 space-y-2">
              <button
                onClick={handleParseMermaid}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Parse & Render
              </button>
              <button
                onClick={handleLoadExample}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Load Example
              </button>
            </div>
          </>
        )}
      </div>

      {/* Graph Statistics */}
      <div className="mb-6 p-3 bg-white rounded shadow-sm flex-shrink-0">
        <h3 className="font-semibold mb-2 text-gray-700">Graph Info</h3>
        <div className="text-sm space-y-1 text-gray-600">
          <div>Nodes: {graphData.nodes.length}</div>
          <div>Edges: {graphData.edges.length}</div>
        </div>
      </div>

      {/* Default Node Settings */}
      <div className="mb-6 flex-shrink-0">
        <h3 className="font-semibold mb-2 text-gray-700">Default Node Style</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1 text-gray-600">Shape</label>
            <select
              value={config.defaultNodeShape}
              onChange={(e) => onConfigChange({ ...config, defaultNodeShape: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="rectangle">Rectangle</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-gray-600">Color</label>
            <input
              type="color"
              value={config.defaultNodeColor}
              onChange={(e) => onConfigChange({ ...config, defaultNodeColor: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-gray-600">Size: {config.defaultNodeSize}px</label>
            <input
              type="range"
              min="20"
              max="100"
              value={config.defaultNodeSize}
              onChange={(e) => onConfigChange({ ...config, defaultNodeSize: Number(e.target.value) })}
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Default Edge Settings */}
      <div className="mb-6 flex-shrink-0">
        <h3 className="font-semibold mb-2 text-gray-700">Default Edge Style</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1 text-gray-600">Color</label>
            <input
              type="color"
              value={config.defaultEdgeColor}
              onChange={(e) => onConfigChange({ ...config, defaultEdgeColor: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-gray-600">Width: {config.defaultEdgeWidth}px</label>
            <input
              type="range"
              min="1"
              max="10"
              value={config.defaultEdgeWidth}
              onChange={(e) => onConfigChange({ ...config, defaultEdgeWidth: Number(e.target.value) })}
              className="w-full cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-gray-600">Style</label>
            <select
              value={config.defaultEdgeStyle}
              onChange={(e) => onConfigChange({ ...config, defaultEdgeStyle: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-3 bg-blue-50 rounded text-sm flex-shrink-0">
        <h3 className="font-semibold mb-2 text-blue-900">How to Use</h3>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Drag nodes to reposition</li>
          <li>Click edge to show control point</li>
          <li>Drag control point to curve edge</li>
          <li>Scroll to zoom in/out</li>
          <li>Drag canvas to pan</li>
        </ul>
      </div>

      {/* Export Section */}
      <div className="mb-6 flex-shrink-0">
        <h3 className="font-semibold mb-2 text-gray-700">Export</h3>
        <ExportButton />
      </div>

      {/* Clear Button */}
      <button
        onClick={handleClear}
        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 flex-shrink-0"
      >
        Clear Graph
      </button>
    </div>
  );
};

