export interface Word {
  english: string;
  chinese: string;
}

export interface QueueItem {
  index: number;
  mistakes: number;
  hinted: boolean;
}

export interface WordlistInfo {
  name: string;
  filename: string;
  count: number;
}

export interface MistakeInfo {
  count: number;
  hinted?: boolean;
}
