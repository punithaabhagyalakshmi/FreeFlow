import { Point, Stroke } from '../types';

function getDistance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function getPathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += getDistance(points[i - 1], points[i]);
  }
  return length;
}

function distancePointToLine(p: Point, l1: Point, l2: Point): number {
  const dx = l2.x - l1.x;
  const dy = l2.y - l1.y;
  if (dx === 0 && dy === 0) {
    return getDistance(p, l1);
  }
  const t = ((p.x - l1.x) * dx + (p.y - l1.y) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = l1.x + clampedT * dx;
  const projY = l1.y + clampedT * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const dist = distancePointToLine(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const results1 = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
    const results2 = ramerDouglasPeucker(points.slice(index), epsilon);
    return results1.slice(0, results1.length - 1).concat(results2);
  } else {
    return [points[0], points[end]];
  }
}

export function recognizeShape(stroke: Stroke): Stroke | null {
  const points = stroke.points;
  if (points.length < 8) return null;

  // Calculate bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const center: Point = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const size = Math.max(width, height);

  // Ignore tiny movements or drawings
  if (size < 30) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const startEndDist = getDistance(start, end);
  const totalLength = getPathLength(points);

  // 1. Is it a Straight Line?
  // Check max deviation from line start-end
  let maxLineDeviation = 0;
  for (const p of points) {
    const dev = distancePointToLine(p, start, end);
    if (dev > maxLineDeviation) maxLineDeviation = dev;
  }

  if (maxLineDeviation < size * 0.12 && startEndDist / totalLength > 0.85) {
    // Generate a clean straight line
    return {
      ...stroke,
      type: 'line',
      shapeData: {
        points: [start, end]
      }
    };
  }

  // Check if closed (start and end are relatively close)
  const isClosed = startEndDist < size * 0.4 || startEndDist < 100;

  if (isClosed) {
    // 2. Is it a Circle?
    // Check radius variance from centroid
    let sumRadius = 0;
    const radii: number[] = [];
    for (const p of points) {
      const r = getDistance(p, center);
      sumRadius += r;
      radii.push(r);
    }
    const meanRadius = sumRadius / points.length;

    let variance = 0;
    for (const r of radii) {
      variance += Math.pow(r - meanRadius, 2);
    }
    const stdDev = Math.sqrt(variance / points.length);
    const cv = stdDev / meanRadius; // Coefficient of variation

    if (cv < 0.16) {
      return {
        ...stroke,
        type: 'circle',
        shapeData: {
          center,
          radius: meanRadius
        }
      };
    }

    // 3. Polygon simplification (Triangle / Rectangle)
    // Make a closed loop for simplification
    const closedPoints = [...points];
    if (getDistance(start, end) > 5) {
      closedPoints.push(start);
    }

    const epsilon = size * 0.1;
    const simplified = ramerDouglasPeucker(closedPoints, epsilon);

    // simplified contains vertices, where simplified[0] and simplified[simplified.length - 1] are identical
    const vertexCount = simplified.length - 1;

    if (vertexCount === 3) {
      // Triangle
      return {
        ...stroke,
        type: 'triangle',
        shapeData: {
          points: simplified.slice(0, 3)
        }
      };
    } else if (vertexCount === 4) {
      // Rectangle or Square
      const isSquare = Math.abs(width - height) / size < 0.15;
      if (isSquare) {
        const side = size;
        return {
          ...stroke,
          type: 'square',
          shapeData: {
            center,
            width: side,
            height: side
          }
        };
      } else {
        return {
          ...stroke,
          type: 'rectangle',
          shapeData: {
            center,
            width,
            height
          }
        };
      }
    }
  }

  // Return null if no matches, keeping the stroke as freeform
  return null;
}
