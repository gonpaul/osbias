export type AIRequest = {
  prompt: string;
  system?: string;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
};

export type AIResponseChunk = { text: string; done?: boolean };

export interface AIProvider {
  complete(req: AIRequest): Promise<string>;
  /**
   * Stream completion as an async iterator of text chunks. The iterator
   * should end with a final chunk where done=true (text may be empty).
   */
  streamComplete(req: AIRequest): AsyncIterable<AIResponseChunk>;
  getAvailableModels(): string[];
}


