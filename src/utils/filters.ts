/**
 * Filter utilities for component filtering
 */

import { Component, FilterState, Brand } from '../types';

export function filterComponents(
  components: Component[],
  filters: FilterState
): Component[] {
  let filtered = [...components];

  // Filter by component type
  if (filters.componentType) {
    filtered = filtered.filter((c) => c.type === filters.componentType);
  }

  // Filter by brands
  if (filters.brands && filters.brands.length > 0) {
    filtered = filtered.filter((c) => filters.brands!.includes(c.brand));
  }

  // Filter by price range
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    filtered = filtered.filter((c) => c.price >= min && c.price <= max);
  }

  // Filter by release year
  if (filters.releaseYear) {
    filtered = filtered.filter((c) => {
      const year = new Date(c.releaseDate).getFullYear();
      return year === filters.releaseYear;
    });
  }

  // Filter by minimum rating
  if (filters.minRating) {
    filtered = filtered.filter((c) => c.rating >= filters.minRating!);
  }

  // Filter by specs (component-specific)
  if (filters.specs) {
    filtered = filtered.filter((c) => {
      return Object.entries(filters.specs!).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        
        const specValue = (c.specs as any)[key];
        if (Array.isArray(value)) {
          return value.includes(specValue);
        }
        if (typeof value === 'object' && value.min !== undefined) {
          return specValue >= value.min && specValue <= (value.max || Infinity);
        }
        return specValue === value;
      });
    });
  }

  return filtered;
}

export function sortComponents(
  components: Component[],
  sortBy: FilterState['sortBy'] = 'popularity'
): Component[] {
  const sorted = [...components];

  switch (sortBy) {
    case 'performance':
      return sorted.sort((a, b) => b.performanceScore - a.performanceScore);
    case 'price':
      return sorted.sort((a, b) => a.price - b.price);
    case 'value':
      return sorted.sort((a, b) => {
        const valueA = a.performanceScore / (a.price || 1);
        const valueB = b.performanceScore / (b.price || 1);
        return valueB - valueA;
      });
    case 'popularity':
      return sorted.sort((a, b) => b.popularity - a.popularity);
    case 'newest':
      return sorted.sort((a, b) => {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });
    default:
      return sorted;
  }
}

export function getPriceRange(components: Component[]): [number, number] {
  if (components.length === 0) return [0, 1000];
  
  const prices = components.map((c) => c.price).filter((p) => p > 0);
  if (prices.length === 0) return [0, 1000];
  
  return [Math.min(...prices), Math.max(...prices)];
}

export function getAvailableBrands(
  components: Component[],
  componentType?: Component['type']
): Brand[] {
  let filtered = components;
  if (componentType) {
    filtered = components.filter((c) => c.type === componentType);
  }
  
  const brands = new Set(filtered.map((c) => c.brand));
  return Array.from(brands).sort();
}
