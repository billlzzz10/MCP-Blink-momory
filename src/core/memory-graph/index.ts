import type { Entity, Relation, GraphStats } from '../../types/memory.types';
import { logger } from '../../utils/logger';

export interface GraphNode {
  id: string;
  entity: Entity;
  connections: Set<string>;
}

export interface GraphEdge {
  id: string;
  relation: Relation;
}

export class MemoryGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map();

  addNode(entity: Entity): void {
    const node: GraphNode = {
      id: entity.id,
      entity,
      connections: new Set()
    };
    
    this.nodes.set(entity.id, node);
    this.adjacencyList.set(entity.id, new Set());
    
    logger.debug(`Added node to graph: ${entity.name} (${entity.id})`);
  }

  addEdge(relation: Relation): void {
    const edge: GraphEdge = {
      id: relation.id,
      relation
    };
    
    this.edges.set(relation.id, edge);
    
    // Update adjacency list
    if (!this.adjacencyList.has(relation.from)) {
      this.adjacencyList.set(relation.from, new Set());
    }
    if (!this.adjacencyList.has(relation.to)) {
      this.adjacencyList.set(relation.to, new Set());
    }
    
    this.adjacencyList.get(relation.from)?.add(relation.to);
    
    // Update node connections
    this.nodes.get(relation.from)?.connections.add(relation.to);
    this.nodes.get(relation.to)?.connections.add(relation.from);
    
    logger.debug(`Added edge to graph: ${relation.from} -> ${relation.to} (${relation.relationType})`);
  }

  getConnectedNodes(nodeId: string, depth: number = 1): Set<string> {
    const visited = new Set<string>();
    const queue: Array<{ id: string; currentDepth: number }> = [{ id: nodeId, currentDepth: 0 }];
    
    while (queue.length > 0) {
      const { id, currentDepth } = queue.shift()!;
      
      if (visited.has(id) || currentDepth > depth) continue;
      
      visited.add(id);
      
      const connections = this.adjacencyList.get(id);
      if (connections && currentDepth < depth) {
        connections.forEach(connectedId => {
          if (!visited.has(connectedId)) {
            queue.push({ id: connectedId, currentDepth: currentDepth + 1 });
          }
        });
      }
    }
    
    visited.delete(nodeId); // Remove self
    return visited;
  }

  getStats(): GraphStats {
    const totalObservations = Array.from(this.nodes.values())
      .reduce((sum, node) => sum + node.entity.observations.length, 0);
    
    const allTags = new Set<string>();
    this.nodes.forEach(node => {
      node.entity.autoTags?.forEach(tag => allTags.add(tag));
    });

    return {
      entities: this.nodes.size,
      relations: this.edges.size,
      observations: totalObservations,
      tags: allTags.size,
      lastUpdated: new Date().toISOString()
    };
  }

  findShortestPath(fromId: string, toId: string): string[] | null {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return null;
    
    const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      
      if (id === toId) return path;
      if (visited.has(id)) continue;
      
      visited.add(id);
      
      const connections = this.adjacencyList.get(id);
      if (connections) {
        connections.forEach(connectedId => {
          if (!visited.has(connectedId)) {
            queue.push({ id: connectedId, path: [...path, connectedId] });
          }
        });
      }
    }
    
    return null;
  }
}

export const memoryGraph = new MemoryGraph();