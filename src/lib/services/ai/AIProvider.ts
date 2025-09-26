export type AIRequest = {
  prompt: string;
  system?: string;
  maxTokens?: number;
  stream?: boolean;
};

export type AIResponseChunk = { text: string; done?: boolean };

export interface AIProvider {
  complete(req: AIRequest): Promise<string>;
}


