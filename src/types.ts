export interface Beat {
  id: string;
  chapterId: string;
  order: number;
  summary: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  color: string;
}

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RootStackParamList = {
  Timeline: undefined;
  BeatDetail: { beatId: string };
};
