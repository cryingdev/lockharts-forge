
/**
 * GameRandom
 * A seeded random number generator to ensure reproducible results for testing.
 * Uses a simple Linear Congruential Generator (LCG).
 */
export class GameRandom {
    private seed: number;

    constructor(seed: number = Date.now()) {
        this.seed = seed;
    }

    /**
     * Sets the current seed.
     */
    setSeed(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a random float between 0 (inclusive) and 1 (exclusive).
     */
    next(): number {
        // LCG constants (Numerical Recipes)
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    /**
     * Returns a random float between [min, max).
     */
    range(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /**
     * Returns a random integer between [min, max] (inclusive).
     * This is the standard "rounding" rule for integer ranges.
     */
    rangeInt(min: number, max: number): number {
        return Math.floor(this.range(min, max + 1));
    }

    /**
     * Rounds a value to a specific number of decimal places.
     */
    round(val: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
    }

    /**
     * Returns true with a given probability (0.0 to 1.0).
     */
    chance(prob: number): boolean {
        return this.next() < prob;
    }

    /**
     * Picks a random element from an array.
     */
    pick<T>(arr: T[]): T {
        if (arr.length === 0) throw new Error("Cannot pick from an empty array");
        return arr[this.rangeInt(0, arr.length - 1)];
    }

    /**
     * Clamps a value between min and max.
     * Standard "clamp" rule for ensuring values stay within bounds.
     */
    clamp(val: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, val));
    }

    /**
     * Standardized RNG Rule: Range + Round + Clamp
     * Combines all three requirements into a single call.
     */
    standard(min: number, max: number, decimals: number = 0, clampMin?: number, clampMax?: number): number {
        let val = this.range(min, max);
        val = this.round(val, decimals);
        if (clampMin !== undefined && clampMax !== undefined) {
            val = this.clamp(val, clampMin, clampMax);
        }
        return val;
    }
}

// Global singleton for general game use
export const rng = new GameRandom();
