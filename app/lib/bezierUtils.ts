/**
 * Utilities for Bezier curve calculations and rendering
 */

import { Point, ControlPoint } from './graphTypes';

/**
 * Calculate a point on a quadratic Bezier curve
 * @param t Parameter from 0 to 1
 * @param p0 Start point
 * @param p1 Control point
 * @param p2 End point
 */
export function quadraticBezierPoint(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point
): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/**
 * Calculate a point on a cubic Bezier curve
 * @param t Parameter from 0 to 1
 * @param p0 Start point
 * @param p1 First control point
 * @param p2 Second control point
 * @param p3 End point
 */
export function cubicBezierPoint(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  };
}

/**
 * Calculate the tangent (derivative) at a point on a quadratic Bezier curve
 */
export function quadraticBezierTangent(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point
): Point {
  const mt = 1 - t;
  return {
    x: 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
  };
}

/**
 * Calculate the tangent at a point on a cubic Bezier curve
 */
export function cubicBezierTangent(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  
  return {
    x: 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x),
    y: 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y),
  };
}

/**
 * Generate SVG path data for a quadratic Bezier curve
 */
export function quadraticBezierPath(
  start: Point,
  control: Point,
  end: Point
): string {
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

/**
 * Generate SVG path data for a cubic Bezier curve
 */
export function cubicBezierPath(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point
): string {
  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
}

/**
 * Calculate a default control point for a curved edge
 * Places it perpendicular to the line between start and end
 * @param offset How far to offset (positive = right, negative = left)
 */
export function calculateDefaultControlPoint(
  start: Point,
  end: Point,
  offset = 0.3
): Point {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Vector from start to end
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Perpendicular vector (rotate 90 degrees)
  const perpX = -dy;
  const perpY = dx;
  
  // Normalize and scale by offset
  const length = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
  const normalizedOffset = offset * length;
  
  return {
    x: midX + (perpX / length) * normalizedOffset,
    y: midY + (perpY / length) * normalizedOffset,
  };
}

/**
 * Calculate the angle of a vector
 */
export function vectorAngle(dx: number, dy: number): number {
  return Math.atan2(dy, dx);
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is near another point (for hit detection)
 */
export function isPointNear(
  p1: Point,
  p2: Point,
  threshold: number
): boolean {
  return distance(p1, p2) < threshold;
}

/**
 * Calculate the closest point on a Bezier curve to a given point
 * Uses iterative sampling for approximation
 */
export function closestPointOnQuadraticBezier(
  point: Point,
  p0: Point,
  p1: Point,
  p2: Point,
  samples = 20
): { point: Point; t: number; distance: number } {
  let minDist = Infinity;
  let minT = 0;
  let minPoint = p0;
  
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const curvePoint = quadraticBezierPoint(t, p0, p1, p2);
    const dist = distance(point, curvePoint);
    
    if (dist < minDist) {
      minDist = dist;
      minT = t;
      minPoint = curvePoint;
    }
  }
  
  return {
    point: minPoint,
    t: minT,
    distance: minDist,
  };
}

/**
 * Generate multiple control points for smooth curves with multiple segments
 */
export function generateSmoothCurvePoints(
  points: Point[],
  tension = 0.5
): ControlPoint[] {
  if (points.length < 2) return [];
  
  const controlPoints: ControlPoint[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    // Calculate control points using Catmull-Rom to Bezier conversion
    const cp1 = {
      x: p1.x + (p2.x - p0.x) / 6 * tension,
      y: p1.y + (p2.y - p0.y) / 6 * tension,
      id: `cp-${i}-1`,
    };
    
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / 6 * tension,
      y: p2.y - (p3.y - p1.y) / 6 * tension,
      id: `cp-${i}-2`,
    };
    
    controlPoints.push(cp1, cp2);
  }
  
  return controlPoints;
}

