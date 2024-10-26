import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { LanguageModelV1 } from "ai";

const modelProviderMap = {
    "claude-3-5-sonnet-20240620": anthropic,
    "claude-3-opus": anthropic,
    "claude-3.5-sonnet": anthropic,
    "gemini-1.5-pro": google,
    "gemini-1.5-flash": google,
    "gemini-1.5-flash-002": google,
    "gemini-1.5-flash-8b": google,
    "gemini-1.5-pro-002": google,
    "gpt-3.5-turbo": openai,
    "gpt-4o": openai,
    "gpt-4": openai,
    "gpt-4o-mini": openai,
    "o1-mini": openai,
    "o1-preview": openai
  };

  function getModelInstance(modelName: string): LanguageModelV1 {
    const provider = modelProviderMap[modelName as keyof typeof modelProviderMap];
    if (!provider) {
      throw new Error(`Model ${modelName} not supported`);
    }
  
    const modelInstance = provider(modelName) as LanguageModelV1;
  
    return modelInstance;
  }

  const getAiModels = () => {
    const models = [];

    if (process.env.ANTHROPIC_API_KEY) {
      models.push(...Object.keys(modelProviderMap).filter((model) => model.includes("claude")));
    }
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      models.push(...Object.keys(modelProviderMap).filter((model) => model.includes("gemini") || model.includes("gemma")));
    }
    if (process.env.OPENAI_API_KEY) {
      models.push(...Object.keys(modelProviderMap).filter((model) => model.includes("gpt") || model.includes("o1")));
    }
    return models;
  };

export { getModelInstance, getAiModels };
