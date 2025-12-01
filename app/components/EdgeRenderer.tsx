'use client';

import React from 'react';
import { GraphEdge, GraphNode, ControlPoint } from '../lib/graphTypes';
import {
  quadraticBezierPath,
  quadraticBezierPoint,
  quadraticBezierTangent,
  vectorAngle,
  calculateDefaultControlPoint,
} from '../lib/bezierUtils';

interface EdgeRendererProps {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  width: number;
  height: number;
  onControlPointMouseDown?: (e: React.MouseEvent, edgeId: string, controlPointId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  isSelected?: boolean;
  showControlPoints?: boolean;
}

export const EdgeRenderer: React.FC<EdgeRendererProps> = ({
  edge,
  sourceNode,
  targetNode,
  width,
  height,
  onControlPointMouseDown,
  onEdgeClick,
  isSelected = false,
  showControlPoints = false,
}) => {
  if (edge.hidden || sourceNode.hidden || targetNode.hidden) return null;

  const startX = sourceNode.x * width;
  const startY = sourceNode.y * height;
  const endX = targetNode.x * width;
  const endY = targetNode.y * height;

  // Calculate control point
  let controlPoint = edge.controlPoints?.[0];
  if (!controlPoint) {
    // Generate default control point
    const defaultCP = calculateDefaultControlPoint(
      { x: startX, y: startY },
      { x: endX, y: endY },
      0.2
    );
    controlPoint = {
      x: defaultCP.x / width,
      y: defaultCP.y / height,
      id: `${edge.id}-cp-0`,
    };
  }

  const cpX = controlPoint.x * width;
  const cpY = controlPoint.y * height;

  // Calculate path
  const path = quadraticBezierPath(
    { x: startX, y: startY },
    { x: cpX, y: cpY },
    { x: endX, y: endY }
  );

  // Calculate arrowhead positions
  const arrowSize = 12;
  const nodeSize = targetNode.size;

  // Point at end of edge (adjusted for node size and arrow)
  const t = 1 - (nodeSize + arrowSize) / Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
  const arrowTip = quadraticBezierPoint(
    Math.max(0, Math.min(1, t)),
    { x: startX, y: startY },
    { x: cpX, y: cpY },
    { x: endX, y: endY }
  );

  // Calculate arrow angle
  const tangent = quadraticBezierTangent(
    Math.max(0, Math.min(1, t)),
    { x: startX, y: startY },
    { x: cpX, y: cpY },
    { x: endX, y: endY }
  );
  const angle = vectorAngle(tangent.x, tangent.y);

  // Arrow path
  const arrowPath = `
    M ${arrowTip.x} ${arrowTip.y}
    L ${arrowTip.x - arrowSize * Math.cos(angle - Math.PI / 6)} ${arrowTip.y - arrowSize * Math.sin(angle - Math.PI / 6)}
    L ${arrowTip.x - arrowSize * Math.cos(angle + Math.PI / 6)} ${arrowTip.y - arrowSize * Math.sin(angle + Math.PI / 6)}
    Z
  `;

  // For bidirected, also calculate arrow at start
  let startArrowPath = '';
  if (edge.type === 'bidirected') {
    const startT = (sourceNode.size + arrowSize) / Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
    const startArrowTip = quadraticBezierPoint(
      Math.max(0, Math.min(1, startT)),
      { x: startX, y: startY },
      { x: cpX, y: cpY },
      { x: endX, y: endY }
    );
    
    const startTangent = quadraticBezierTangent(
      Math.max(0, Math.min(1, startT)),
      { x: startX, y: startY },
      { x: cpX, y: cpY },
      { x: endX, y: endY }
    );
    const startAngle = vectorAngle(startTangent.x, startTangent.y) + Math.PI;
    
    startArrowPath = `
      M ${startArrowTip.x} ${startArrowTip.y}
      L ${startArrowTip.x - arrowSize * Math.cos(startAngle - Math.PI / 6)} ${startArrowTip.y - arrowSize * Math.sin(startAngle - Math.PI / 6)}
      L ${startArrowTip.x - arrowSize * Math.cos(startAngle + Math.PI / 6)} ${startArrowTip.y - arrowSize * Math.sin(startAngle + Math.PI / 6)}
      Z
    `;
  }

  const strokeWidth = isSelected ? edge.width + 2 : edge.width;
  const strokeColor = isSelected ? '#3b82f6' : edge.color;

  const handleEdgeClick = () => {
    if (onEdgeClick) {
      onEdgeClick(edge.id);
    }
  };

  const handleControlPointMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onControlPointMouseDown && controlPoint) {
      onControlPointMouseDown(e, edge.id, controlPoint.id);
    }
  };

  return (
    <g className="edge">
      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(10, edge.width)}
        style={{ cursor: 'pointer' }}
        onClick={handleEdgeClick}
      />
      
      {/* Visible edge path */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeOpacity={edge.opacity}
        strokeDasharray={edge.style === 'dashed' ? '5,5' : edge.style === 'dotted' ? '2,2' : 'none'}
        pointerEvents="none"
      />
      
      {/* Arrow at end */}
      {edge.type === 'directed' || edge.type === 'bidirected' ? (
        <path
          d={arrowPath}
          fill={strokeColor}
          fillOpacity={edge.opacity}
          pointerEvents="none"
        />
      ) : null}
      
      {/* Arrow at start (for bidirected) */}
      {edge.type === 'bidirected' && startArrowPath ? (
        <path
          d={startArrowPath}
          fill={strokeColor}
          fillOpacity={edge.opacity}
          pointerEvents="none"
        />
      ) : null}
      
      {/* Control point visualization */}
      {showControlPoints && controlPoint ? (
        <circle
          cx={cpX}
          cy={cpY}
          r={6}
          fill="#f59e0b"
          stroke="#fff"
          strokeWidth={2}
          style={{ cursor: 'move' }}
          onMouseDown={handleControlPointMouseDown}
        />
      ) : null}
      
      {/* Edge annotations */}
      {edge.annotations?.map((annotation, index) => {
        const pos = annotation.position || 0.5;
        const point = quadraticBezierPoint(
          pos,
          { x: startX, y: startY },
          { x: cpX, y: cpY },
          { x: endX, y: endY }
        );
        const offset = annotation.offset || 10;
        
        // Calculate perpendicular offset
        const tangentAtPos = quadraticBezierTangent(
          pos,
          { x: startX, y: startY },
          { x: cpX, y: cpY },
          { x: endX, y: endY }
        );
        const perpAngle = vectorAngle(tangentAtPos.x, tangentAtPos.y) + Math.PI / 2;
        
        const labelX = point.x + Math.cos(perpAngle) * offset;
        const labelY = point.y + Math.sin(perpAngle) * offset;
        
        return (
          <text
            key={index}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#323232"
            fontSize={12}
            fontFamily="sans-serif"
            pointerEvents="none"
          >
            {annotation.value}
          </text>
        );
      })}
    </g>
  );
};

