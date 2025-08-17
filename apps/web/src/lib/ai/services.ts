import { TranscriptionService, EmbeddingService, ClassificationService, PIIDetection } from './interfaces'

// OpenAI Transcription Service
export class OpenAITranscriptionService implements TranscriptionService {
  constructor(private apiKey: string) {}

  async transcribe(audioUrl: string): Promise<string> {
    try {
      // Download the audio file
      const audioResponse = await fetch(audioUrl)
      const audioBuffer = await audioResponse.arrayBuffer()
      const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' })

      // Send to OpenAI Whisper
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('model', 'whisper-1')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`OpenAI transcription failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.text || ''
    } catch (error) {
      console.error('Transcription error:', error)
      return ''
    }
  }
}

// Local Whisper Service (fallback)
export class LocalTranscriptionService implements TranscriptionService {
  constructor(private endpoint: string = 'http://localhost:8001') {}

  async transcribe(audioUrl: string): Promise<string> {
    try {
      const response = await fetch(`${this.endpoint}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: audioUrl }),
      })

      if (!response.ok) {
        throw new Error(`Local transcription failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.text || ''
    } catch (error) {
      console.error('Local transcription error:', error)
      return ''
    }
  }
}

// OpenAI Embedding Service
export class OpenAIEmbeddingService implements EmbeddingService {
  constructor(private apiKey: string) {}

  async embed(text: string): Promise<number[]> {
    try {
      // Truncate text to token limit (roughly 8000 chars for text-embedding-3-large)
      const truncatedText = text.slice(0, 8000)

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-large',
          input: truncatedText,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI embedding failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data[0]?.embedding || []
    } catch (error) {
      console.error('Embedding error:', error)
      return []
    }
  }
}

// Local Embedding Service (fallback)
export class LocalEmbeddingService implements EmbeddingService {
  constructor(private endpoint: string = 'http://localhost:8002') {}

  async embed(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.endpoint}/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.slice(0, 8000) }),
      })

      if (!response.ok) {
        throw new Error(`Local embedding failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.embedding || []
    } catch (error) {
      console.error('Local embedding error:', error)
      return []
    }
  }
}

// Rule-based Classification Service (always works)
export class RuleBasedClassificationService implements ClassificationService {
  private emotionKeywords = {
    joy: ['happy', 'excited', 'joy', 'celebration', 'wonderful', 'amazing', 'great', 'love'],
    sadness: ['sad', 'disappointed', 'lonely', 'grief', 'loss', 'hurt', 'pain'],
    anger: ['angry', 'frustrated', 'mad', 'rage', 'furious', 'annoyed'],
    fear: ['scared', 'afraid', 'anxious', 'worried', 'nervous', 'panic'],
    surprise: ['surprised', 'shocked', 'unexpected', 'sudden', 'wow'],
    nostalgia: ['remember', 'reminds', 'childhood', 'past', 'memories', 'used to'],
    gratitude: ['grateful', 'thankful', 'appreciate', 'blessed', 'lucky'],
    pride: ['proud', 'accomplished', 'achievement', 'success', 'won'],
  }

  private themeKeywords = {
    family: ['family', 'mother', 'father', 'parents', 'siblings', 'children', 'kids', 'relatives'],
    work: ['work', 'job', 'career', 'office', 'colleague', 'boss', 'meeting', 'project'],
    travel: ['travel', 'trip', 'vacation', 'journey', 'airport', 'hotel', 'sightseeing'],
    health: ['health', 'doctor', 'hospital', 'medicine', 'exercise', 'fitness', 'illness'],
    education: ['school', 'university', 'learning', 'study', 'teacher', 'student', 'exam'],
    relationships: ['friend', 'partner', 'relationship', 'dating', 'marriage', 'love'],
    hobbies: ['hobby', 'music', 'art', 'reading', 'sports', 'gaming', 'cooking'],
    home: ['home', 'house', 'apartment', 'garden', 'neighborhood', 'moving'],
    nature: ['nature', 'outdoors', 'hiking', 'beach', 'mountains', 'forest', 'animals'],
    celebration: ['birthday', 'wedding', 'holiday', 'party', 'anniversary', 'graduation'],
  }

  private piiPatterns = [
    { type: 'email' as const, pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
    { type: 'phone' as const, pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
    { type: 'ssn' as const, pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { type: 'credit_card' as const, pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g },
  ]

  async classifyEmotions(text: string): Promise<string[]> {
    const lowerText = text.toLowerCase()
    const detectedEmotions: string[] = []

    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedEmotions.push(emotion)
      }
    }

    return detectedEmotions
  }

  async classifyThemes(text: string): Promise<string[]> {
    const lowerText = text.toLowerCase()
    const detectedThemes: string[] = []

    for (const [theme, keywords] of Object.entries(this.themeKeywords)) {
      const matchCount = keywords.filter(keyword => lowerText.includes(keyword)).length
      if (matchCount >= 1) {
        detectedThemes.push(theme)
      }
    }

    return detectedThemes
  }

  async detectPII(text: string): Promise<PIIDetection[]> {
    const detections: PIIDetection[] = []

    for (const { type, pattern } of this.piiPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        detections.push({
          text: match[0],
          type,
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.9,
        })
      }
      pattern.lastIndex = 0 // Reset regex
    }

    return detections
  }
}

// OpenAI-based Classification Service
export class OpenAIClassificationService implements ClassificationService {
  constructor(private apiKey: string) {}

  async classifyEmotions(text: string): Promise<string[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an emotion classifier. Return only a JSON array of emotions detected in the text. Use these emotions: joy, sadness, anger, fear, surprise, nostalgia, gratitude, pride, anxiety, excitement, contentment, frustration.',
            },
            {
              role: 'user',
              content: text.slice(0, 2000),
            },
          ],
          max_tokens: 100,
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        throw new Error('OpenAI classification failed')
      }

      const result = await response.json()
      const content = result.choices[0]?.message?.content || '[]'
      return JSON.parse(content)
    } catch (error) {
      console.error('OpenAI emotion classification error:', error)
      // Fallback to rule-based
      const fallback = new RuleBasedClassificationService()
      return fallback.classifyEmotions(text)
    }
  }

  async classifyThemes(text: string): Promise<string[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a theme classifier. Return only a JSON array of themes detected in the text. Use these themes: family, work, travel, health, education, relationships, hobbies, home, nature, celebration, personal_growth, challenges, achievements, memories, daily_life.',
            },
            {
              role: 'user',
              content: text.slice(0, 2000),
            },
          ],
          max_tokens: 100,
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        throw new Error('OpenAI classification failed')
      }

      const result = await response.json()
      const content = result.choices[0]?.message?.content || '[]'
      return JSON.parse(content)
    } catch (error) {
      console.error('OpenAI theme classification error:', error)
      // Fallback to rule-based
      const fallback = new RuleBasedClassificationService()
      return fallback.classifyThemes(text)
    }
  }

  async detectPII(text: string): Promise<PIIDetection[]> {
    // For now, use rule-based PII detection as it's more reliable
    const fallback = new RuleBasedClassificationService()
    return fallback.detectPII(text)
  }
}
