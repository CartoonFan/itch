import fastMemoize from "fast-memoize";
import { LRUCache } from "lru-cache";

export function memoize<T>(limit: number, f: T): T {
  return fastMemoize(f, {
    cache: {
      create: () => new LRUCache({ max: limit }),
    },
  });
}
