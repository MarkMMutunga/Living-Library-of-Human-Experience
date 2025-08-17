/**
 * Living Library of Human Experience - AI Service Factory
 * 
 * Copyright (c) 2025 Mark Mikile Mutunga
 * Author: Mark Mikile Mutunga <markmiki03@gmail.com>
 * Phone: +254 707 678 643
 * 
 * This file is part of the Living Library of Human Experience platform.
 * Licensed under proprietary license - see LICENSE file for details.
 */

import {
  TranscriptionService,
  EmbeddingService,
  ClassificationService,
  AIServiceConfig,
} from './interfaces'
import {
  OpenAITranscriptionService,
  LocalTranscriptionService,
  OpenAIEmbeddingService,
  LocalEmbeddingService,
  OpenAIClassificationService,
  RuleBasedClassificationService,
} from './services'

export class AIServiceFactory {
  private config: AIServiceConfig

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  createTranscriptionService(): TranscriptionService {
    switch (this.config.transcriptionProvider) {
      case 'openai':
        if (!this.config.openaiApiKey) {
          console.warn('OpenAI API key not provided, falling back to local transcription')
          return new LocalTranscriptionService(this.config.localEndpoints?.whisper)
        }
        return new OpenAITranscriptionService(this.config.openaiApiKey)
      case 'local':
        return new LocalTranscriptionService(this.config.localEndpoints?.whisper)
      default:
        return new LocalTranscriptionService(this.config.localEndpoints?.whisper)
    }
  }

  createEmbeddingService(): EmbeddingService {
    switch (this.config.embeddingProvider) {
      case 'openai':
        if (!this.config.openaiApiKey) {
          console.warn('OpenAI API key not provided, falling back to local embeddings')
          return new LocalEmbeddingService(this.config.localEndpoints?.embedding)
        }
        return new OpenAIEmbeddingService(this.config.openaiApiKey)
      case 'local':
        return new LocalEmbeddingService(this.config.localEndpoints?.embedding)
      default:
        return new LocalEmbeddingService(this.config.localEndpoints?.embedding)
    }
  }

  createClassificationService(): ClassificationService {
    switch (this.config.classificationProvider) {
      case 'openai':
        if (!this.config.openaiApiKey) {
          console.warn('OpenAI API key not provided, falling back to rule-based classification')
          return new RuleBasedClassificationService()
        }
        return new OpenAIClassificationService(this.config.openaiApiKey)
      case 'local':
        // For now, local classification falls back to rules
        return new RuleBasedClassificationService()
      case 'rules':
        return new RuleBasedClassificationService()
      default:
        return new RuleBasedClassificationService()
    }
  }
}

// Global factory instance
let globalFactory: AIServiceFactory | null = null

export function getAIServiceFactory(): AIServiceFactory {
  if (!globalFactory) {
    const config: AIServiceConfig = {
      transcriptionProvider: (process.env.TRANSCRIBE_PROVIDER as 'openai' | 'local') || 'local',
      embeddingProvider: (process.env.EMBEDDINGS_PROVIDER as 'openai' | 'local') || 'local',
      classificationProvider: 'rules',
      openaiApiKey: process.env.OPENAI_API_KEY,
      localEndpoints: {
        whisper: process.env.LOCAL_WHISPER_ENDPOINT,
        embedding: process.env.LOCAL_EMBEDDING_ENDPOINT,
        classification: process.env.LOCAL_CLASSIFICATION_ENDPOINT,
      },
    }
    globalFactory = new AIServiceFactory(config)
  }
  return globalFactory
}

// Convenience functions
export function getTranscriptionService(): TranscriptionService {
  return getAIServiceFactory().createTranscriptionService()
}

export function getEmbeddingService(): EmbeddingService {
  return getAIServiceFactory().createEmbeddingService()
}

export function getClassificationService(): ClassificationService {
  return getAIServiceFactory().createClassificationService()
}
