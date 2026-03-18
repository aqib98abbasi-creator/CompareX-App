/**
 * Search utilities using Fuse.js for fuzzy matching
 */

import Fuse from 'fuse.js';
import { Component, ComponentType } from '../types';

export interface SearchOptions {
  componentType?: ComponentType;
  limit?: number;
}

const defaultFuseOptions = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'brand', weight: 0.3 },
    { name: 'type', weight: 0.2 },
  ],
  threshold: 0.3, // Lower = more strict matching
  includeScore: true,
  minMatchCharLength: 2,
};

export function createSearchIndex(components: Component[]): Fuse<Component> {
  return new Fuse(components, defaultFuseOptions);
}

export function searchComponents(
  index: Fuse<Component>,
  query: string,
  options: SearchOptions = {}
): Component[] {
  if (!query.trim()) {
    return [];
  }

  let results = index.search(query);

  // Filter by component type if specified
  if (options.componentType) {
    results = results.filter((result) => result.item.type === options.componentType);
  }

  // Apply limit
  if (options.limit) {
    results = results.slice(0, options.limit);
  }

  return results.map((result) => result.item);
}
