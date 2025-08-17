// Base interfaces for AI services
export interface TranscriptionService {
  transcribe(audioUrl: string): Promise<string>
}

export interface EmbeddingService {
  embed(text: string): Promise<number[]>
}

export interface ClassificationService {
  classifyEmotions(text: string): Promise<string[]>
  classifyThemes(text: string): Promise<string[]>
  detectPII(text: string): Promise<PIIDetection[]>
}

export interface PIIDetection {
  text: string
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'name' | 'address'
  start: number
  end: number
  confidence: number
}

// Configuration for AI services
export interface AIServiceConfig {
  transcriptionProvider: 'openai' | 'local'
  embeddingProvider: 'openai' | 'local'
  classificationProvider: 'openai' | 'local' | 'rules'
  openaiApiKey?: string
  localEndpoints?: {
    whisper?: string
    embedding?: string
    classification?: string
  }
}
