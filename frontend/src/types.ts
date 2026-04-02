export interface Word {
  english: string;
  chinese: string;
}

export interface QueueItem extends Word {
  mistakes: number;
  hinted: boolean;
}

export interface WordlistInfo {
  name: string;
  filename: string;
  count: number;
}

export interface MistakeInfo {
  chinese: string;
  count: number;
  hinted?: boolean;
}
