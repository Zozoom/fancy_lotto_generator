export interface Generation {
  id: string;
  numbers: number[];
  date: string;
  predictedNumbers?: number[];
  manipulationScore?: {
    score: number;
    confidence: number;
    patterns: string[];
  };
}

