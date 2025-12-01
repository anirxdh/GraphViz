/**
 * Parser for Mermaid diagram format
 * Supports basic graph syntax with directed and bidirected edges
 */

import { MermaidParseResult, EdgeType } from './graphTypes';

/**
 * Parse Mermaid diagram format into graph data
 * Supports syntax like:
 * graph TD
 *   A[Node A]
 *   B[Node B]
 *   A --> B
 *   A <--> C
 *   D --> E|0.75|
 */
export function parseMermaidDiagram(mermaidText: string): MermaidParseResult {
  const lines = mermaidText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const nodes = new Map<string, string>(); // id -> label
  const edges: Array<{
    source: string;
    target: string;
    type: EdgeType;
    label?: string;
  }> = [];

  // Skip the first line if it's a graph declaration
  const startIndex = lines[0].match(/^graph\s+(TD|LR|TB|RL|BT)/i) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip comments
    if (line.startsWith('%%')) {
      continue;
    }

    // Parse edges with various arrow types
    const edgePatterns = [
      // Bidirected: A <--> B or A <-->|label| B
      { regex: /^(\w+)\s*<-->\s*(?:\|([^|]+)\|)?\s*(\w+)$/, type: 'bidirected' as EdgeType },
      // Directed: A --> B or A -->|label| B
      { regex: /^(\w+)\s*-->\s*(?:\|([^|]+)\|)?\s*(\w+)$/, type: 'directed' as EdgeType },
      // Undirected: A --- B or A ---|label| B
      { regex: /^(\w+)\s*---\s*(?:\|([^|]+)\|)?\s*(\w+)$/, type: 'undirected' as EdgeType },
    ];

    let edgeMatched = false;
    for (const pattern of edgePatterns) {
      const edgeMatch = line.match(pattern.regex);
      if (edgeMatch) {
        const sourceId = edgeMatch[1];
        const label = edgeMatch[2]?.trim();
        const targetId = edgeMatch[3];
        
        // Ensure nodes exist
        if (!nodes.has(sourceId)) {
          nodes.set(sourceId, sourceId);
        }
        if (!nodes.has(targetId)) {
          nodes.set(targetId, targetId);
        }
        
        edges.push({
          source: sourceId,
          target: targetId,
          type: pattern.type,
          label: label || undefined,
        });
        
        edgeMatched = true;
        break;
      }
    }

    if (edgeMatched) {
      continue;
    }

    // Parse node definitions: A[Label] or A(Label) or A{Label}
    const nodePatterns = [
      /^(\w+)\[([^\]]+)\]$/, // Square brackets
      /^(\w+)\(([^)]+)\)$/, // Parentheses (rounded)
      /^(\w+)\{([^}]+)\}$/, // Curly braces (diamond)
      /^(\w+)$/, // Just ID, no label
    ];

    for (const pattern of nodePatterns) {
      const nodeMatch = line.match(pattern);
      if (nodeMatch) {
        const id = nodeMatch[1];
        const label = nodeMatch[2] ? nodeMatch[2].trim() : id;
        nodes.set(id, label);
        break;
      }
    }
  }

  return {
    nodes: Array.from(nodes.entries()).map(([id, label]) => ({ id, label })),
    edges,
  };
}

/**
 * Convert Mermaid parse result to initial graph data with auto-layout
 * Uses a simple force-directed layout algorithm (Fruchterman-Reingold)
 */
export function autoLayoutGraph(
  parseResult: MermaidParseResult,
  width = 1,
  height = 1
): { nodes: Array<{ id: string; label: string; x: number; y: number }> } {
  const nodes = parseResult.nodes;
  const edges = parseResult.edges;

  if (nodes.length === 0) {
    return { nodes: [] };
  }

  // Initialize with random positions
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, i) => {
    // Use circular initial layout for better starting positions
    const angle = (i / nodes.length) * 2 * Math.PI;
    const radius = 0.3;
    positions.set(node.id, {
      x: 0.5 + radius * Math.cos(angle),
      y: 0.5 + radius * Math.sin(angle),
    });
  });

  // Simple force-directed layout (Fruchterman-Reingold)
  const iterations = 50;
  const k = Math.sqrt(1.0 / nodes.length); // Optimal distance
  const temperature = 0.1;
  const cooling = 0.95;

  let temp = temperature;
  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { x: number; y: number }>();
    
    // Initialize forces
    nodes.forEach(node => {
      forces.set(node.id, { x: 0, y: 0 });
    });

    // Repulsive forces between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        const pos1 = positions.get(node1.id)!;
        const pos2 = positions.get(node2.id)!;
        
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        
        const repulsion = (k * k) / dist;
        const fx = (dx / dist) * repulsion;
        const fy = (dy / dist) * repulsion;
        
        const force1 = forces.get(node1.id)!;
        const force2 = forces.get(node2.id)!;
        force1.x += fx;
        force1.y += fy;
        force2.x -= fx;
        force2.y -= fy;
      }
    }

    // Attractive forces for edges
    edges.forEach(edge => {
      const pos1 = positions.get(edge.source);
      const pos2 = positions.get(edge.target);
      
      if (!pos1 || !pos2) return;
      
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      
      const attraction = (dist * dist) / k;
      const fx = (dx / dist) * attraction;
      const fy = (dy / dist) * attraction;
      
      const force1 = forces.get(edge.source)!;
      const force2 = forces.get(edge.target)!;
      force1.x += fx;
      force1.y += fy;
      force2.x -= fx;
      force2.y -= fy;
    });

    // Apply forces with temperature cooling
    nodes.forEach(node => {
      const pos = positions.get(node.id)!;
      const force = forces.get(node.id)!;
      
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y) || 0.01;
      const displacement = Math.min(magnitude, temp);
      
      pos.x += (force.x / magnitude) * displacement;
      pos.y += (force.y / magnitude) * displacement;
      
      // Keep within bounds with padding
      pos.x = Math.max(0.1, Math.min(0.9, pos.x));
      pos.y = Math.max(0.1, Math.min(0.9, pos.y));
    });

    temp *= cooling;
  }

  return {
    nodes: nodes.map(node => ({
      ...node,
      ...positions.get(node.id)!,
    })),
  };
}

/**
 * Example Mermaid diagram for testing
 */
export const EXAMPLE_MERMAID = `graph TD
  A[Node A]
  B[Node B]
  C[Node C]
  D[Node D]
  A --> B
  B --> C
  C --> D
  D --> A
  A <--> C
  B -->|0.75| D`;

