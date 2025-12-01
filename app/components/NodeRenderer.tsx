'use client';

import React from 'react';
import { GraphNode } from '../lib/graphTypes';

interface NodeRendererProps {
  node: GraphNode;
  width: number;
  height: number;
  onMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
  isSelected?: boolean;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  width,
  height,
  onMouseDown,
  isSelected = false,
}) => {
  if (node.hidden) return null;

  const cx = node.x * width;
  const cy = node.y * height;
  const size = node.size;
  
  // Split label by underscore for multi-line display
  const labelLines = node.label.split('_');
  const fontSize = 14;
  const lineHeight = fontSize + 2;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMouseDown) {
      onMouseDown(e, node.id);
    }
  };

  // Render shape based on node.shape
  const renderShape = () => {
    const strokeWidth = isSelected ? 3 : 1;
    const strokeColor = isSelected ? '#3b82f6' : '#323232';

    switch (node.shape) {
      case 'circle':
        return (
          <circle
            cx={cx}
            cy={cy}
            r={size}
            fill={node.color}
            fillOpacity={node.opacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{ cursor: 'move' }}
            onMouseDown={handleMouseDown}
          />
        );
      
      case 'square':
        return (
          <rect
            x={cx - size}
            y={cy - size}
            width={size * 2}
            height={size * 2}
            fill={node.color}
            fillOpacity={node.opacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{ cursor: 'move' }}
            onMouseDown={handleMouseDown}
          />
        );
      
      case 'rectangle':
        return (
          <rect
            x={cx - size * 1.5}
            y={cy - size}
            width={size * 3}
            height={size * 2}
            fill={node.color}
            fillOpacity={node.opacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx={5}
            style={{ cursor: 'move' }}
            onMouseDown={handleMouseDown}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <g className="node">
      {renderShape()}
      <text
        x={cx}
        y={cy - (labelLines.length - 1) * lineHeight / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#323232"
        fontSize={fontSize}
        fontFamily="sans-serif"
        pointerEvents="none"
      >
        {labelLines.map((line, i) => (
          <tspan
            key={i}
            x={cx}
            dy={i === 0 ? 0 : lineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

