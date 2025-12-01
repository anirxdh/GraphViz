'use client';

import React, { useState, useEffect } from 'react';
import { GraphData, GraphConfig } from './lib/graphTypes';
import { GraphCanvas } from './components/GraphCanvas';
import { ControlPanel } from './components/ControlPanel';
import { parseMermaidDiagram, autoLayoutGraph, EXAMPLE_MERMAID } from './lib/mermaidParser';

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
  });

  const [config, setConfig] = useState<GraphConfig>({
    defaultNodeSize: 50,
    defaultNodeColor: '#c8c8c8',
    defaultNodeShape: 'circle',
    defaultEdgeColor: '#000000',
    defaultEdgeWidth: 2,
    defaultEdgeStyle: 'solid',
    backgroundColor: '#eeeeee',
    fontSize: 14,
    fontFamily: 'sans-serif',
    arrowSize: 12,
  });

  // Load example graph on mount
  useEffect(() => {
    try {
      const parseResult = parseMermaidDiagram(EXAMPLE_MERMAID);
      const layoutResult = autoLayoutGraph(parseResult);
      
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
      
      setGraphData({ nodes: newNodes, edges: newEdges });
    } catch (error) {
      console.error('Error loading example graph:', error);
    }
  }, []); // Only run once on mount

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Control Panel */}
      <ControlPanel
        graphData={graphData}
        onGraphDataChange={setGraphData}
        config={config}
        onConfigChange={setConfig}
      />
      
      {/* Graph Canvas */}
      <div className="flex-1">
        <GraphCanvas
          graphData={graphData}
          onGraphDataChange={setGraphData}
          backgroundColor={config.backgroundColor}
        />
      </div>
    </main>
  );
}
