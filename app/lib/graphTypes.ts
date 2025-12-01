/**
 * Core type definitions for the graph visualization tool
 */

// Node shape types
export type NodeShape = 'circle' | 'square' | 'rectangle';

// Edge types
export type EdgeType = 'directed' | 'bidirected' | 'undirected';

// Edge style types
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

// Point in 2D space
export interface Point {
  x: number;
  y: number;
}

// Node definition
export interface GraphNode {
  id: string;
  label: string;
  x: number; // Normalized coordinates (0-1)
  y: number; // Normalized coordinates (0-1)
  shape: NodeShape;
  color: string; // Hex color
  size: number; // Radius or half-width in pixels
  opacity: number; // 0-1
  hidden?: boolean;
}

// Control point for Bezier curves
export interface ControlPoint {
  x: number;
  y: number;
  id: string; // Unique identifier for this control point
}

// Edge annotation
export interface EdgeAnnotation {
  value: string | number;
  position?: number; // Position along edge (0-1), default 0.5 (middle)
  offset?: number; // Perpendicular offset from edge in pixels
}

// Edge definition
export interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  type: EdgeType;
  color: string; // Hex color
  width: number; // Stroke width in pixels
  style: EdgeStyle;
  opacity: number; // 0-1
  annotations?: EdgeAnnotation[];
  controlPoints?: ControlPoint[]; // For Bezier curves
  hidden?: boolean;
}

// Complete graph data
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Canvas interaction state
export interface InteractionState {
  mode: 'select' | 'pan' | 'edit-curve';
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedControlPointId: string | null;
  isDragging: boolean;
  dragOffset: Point;
}

// Viewport/transform state for zoom and pan
export interface ViewportTransform {
  scale: number; // Zoom level
  offsetX: number; // Pan offset X
  offsetY: number; // Pan offset Y
}

// Mermaid parse result
export interface MermaidParseResult {
  nodes: Array<{
    id: string;
    label: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: EdgeType;
    label?: string;
  }>;
}

// Configuration/settings for the graph
export interface GraphConfig {
  defaultNodeSize: number;
  defaultNodeColor: string;
  defaultNodeShape: NodeShape;
  defaultEdgeColor: string;
  defaultEdgeWidth: number;
  defaultEdgeStyle: EdgeStyle;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  arrowSize: number;
}

// Export configuration
export interface ExportConfig {
  format: 'svg' | 'png';
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeAnnotations: boolean;
}

