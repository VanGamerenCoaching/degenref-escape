export function createSeededRandom(seed: string): () => number {
  let value = 2166136261;

  for (const character of seed) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }

  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  const random = createSeededRandom(seed);

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index];
    const swap = result[swapIndex];

    if (current !== undefined && swap !== undefined) {
      result[index] = swap;
      result[swapIndex] = current;
    }
  }

  return result;
}
