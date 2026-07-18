import OpenAI from "openai";

export interface ResponsesClientOptions {
  apiKey: string;
}

export function createResponsesClient(options: ResponsesClientOptions): OpenAI {
  return new OpenAI({
    apiKey: options.apiKey
  });
}
