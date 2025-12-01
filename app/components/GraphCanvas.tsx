'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GraphData, GraphNode, ViewportTransform, Point } from '../lib/graphTypes';
import { NodeRenderer } from './NodeRenderer';
import { EdgeRenderer } from './EdgeRenderer';

interface GraphCanvasProps {
  graphData: GraphData;
  onGraphDataChange: (data: GraphData) => void;
  backgroundColor?: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graphData,
  onGraphDataChange,
  backgroundColor = '#eeeeee',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState<ViewportTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedControlPointId, setSelectedControlPointId] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [dragNodeOffset, setDragNodeOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Expose SVG ref for export
  useEffect(() => {
    if (svgRef.current) {
      (window as any).__graphSvgElement = svgRef.current;
    }
  }, []);

  // Convert screen coordinates to SVG coordinates
  const screenToSVG = useCallback((screenX: number, screenY: number): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (screenX - rect.left - viewport.offsetX) / viewport.scale,
      y: (screenY - rect.top - viewport.offsetY) / viewport.scale,
    };
  }, [viewport]);

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomIntensity = 0.1;
    const delta = -Math.sign(e.deltaY);
    const zoom = Math.exp(delta * zoomIntensity);
    
    const mousePos = screenToSVG(e.clientX, e.clientY);
    
    setViewport(prev => {
      const newScale = Math.max(0.1, Math.min(10, prev.scale * zoom));
      const scaleDiff = newScale - prev.scale;
      
      return {
        scale: newScale,
        offsetX: prev.offsetX - mousePos.x * scaleDiff,
        offsetY: prev.offsetY - mousePos.y * scaleDiff,
      };
    });
  }, [screenToSVG]);

  // Handle node drag start
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const svgPos = screenToSVG(e.clientX, e.clientY);
    
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragNodeOffset({
      x: svgPos.x - node.x * dimensions.width,
      y: svgPos.y - node.y * dimensions.height,
    });
  }, [graphData.nodes, screenToSVG, dimensions]);

  // Handle control point drag start
  const handleControlPointMouseDown = useCallback((
    e: React.MouseEvent,
    edgeId: string,
    controlPointId: string
  ) => {
    e.stopPropagation();
    
    setSelectedEdgeId(edgeId);
    setSelectedControlPointId(controlPointId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // Handle canvas mouse down (for panning)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && selectedNodeId) {
      // Dragging a node
      const svgPos = screenToSVG(e.clientX, e.clientY);
      
      const newNodes = graphData.nodes.map(node => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            x: (svgPos.x - dragNodeOffset.x) / dimensions.width,
            y: (svgPos.y - dragNodeOffset.y) / dimensions.height,
          };
        }
        return node;
      });
      
      onGraphDataChange({ ...graphData, nodes: newNodes });
    } else if (isDragging && selectedEdgeId && selectedControlPointId) {
      // Dragging a control point
      const svgPos = screenToSVG(e.clientX, e.clientY);
      
      const newEdges = graphData.edges.map(edge => {
        if (edge.id === selectedEdgeId) {
          const newControlPoints = edge.controlPoints?.map(cp => {
            if (cp.id === selectedControlPointId) {
              return {
                ...cp,
                x: svgPos.x / dimensions.width,
                y: svgPos.y / dimensions.height,
              };
            }
            return cp;
          }) || [];
          
          return { ...edge, controlPoints: newControlPoints };
        }
        return edge;
      });
      
      onGraphDataChange({ ...graphData, edges: newEdges });
    } else if (isPanning) {
      // Panning the canvas
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setViewport(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [
    isDragging,
    isPanning,
    selectedNodeId,
    selectedEdgeId,
    selectedControlPointId,
    dragStart,
    dragNodeOffset,
    graphData,
    onGraphDataChange,
    screenToSVG,
    dimensions,
  ]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  // Handle edge click
  const handleEdgeClick = useCallback((edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    
    // Add default control point if edge doesn't have one
    const edge = graphData.edges.find(e => e.id === edgeId);
    if (edge && (!edge.controlPoints || edge.controlPoints.length === 0)) {
      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        // Add perpendicular offset
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const perpX = -dy * 0.2;
        const perpY = dx * 0.2;
        
        const newEdges = graphData.edges.map(e => {
          if (e.id === edgeId) {
            return {
              ...e,
              controlPoints: [{
                id: `${edgeId}-cp-0`,
                x: midX + perpX,
                y: midY + perpY,
              }],
            };
          }
          return e;
        });
        
        onGraphDataChange({ ...graphData, edges: newEdges });
      }
    }
  }, [graphData, onGraphDataChange]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <g transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.scale})`}>
          {/* Render edges first (so they appear behind nodes) */}
          {graphData.edges.map(edge => {
            const sourceNode = graphData.nodes.find(n => n.id === edge.source);
            const targetNode = graphData.nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            return (
              <EdgeRenderer
                key={edge.id}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                width={dimensions.width}
                height={dimensions.height}
                onControlPointMouseDown={handleControlPointMouseDown}
                onEdgeClick={handleEdgeClick}
                isSelected={edge.id === selectedEdgeId}
                showControlPoints={edge.id === selectedEdgeId}
              />
            );
          })}
          
          {/* Render nodes */}
          {graphData.nodes.map(node => (
            <NodeRenderer
              key={node.id}
              node={node}
              width={dimensions.width}
              height={dimensions.height}
              onMouseDown={handleNodeMouseDown}
              isSelected={node.id === selectedNodeId}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

