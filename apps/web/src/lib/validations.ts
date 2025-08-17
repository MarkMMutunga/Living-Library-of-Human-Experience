import { z } from 'zod'

// Fragment schemas
export const createFragmentSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1),
  eventAt: z.string().datetime(),
  locationText: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  visibility: z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']).default('PRIVATE'),
  tags: z.array(z.string()).default([]),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'audio', 'video']),
    duration: z.number().optional(),
    size: z.number().optional(),
    mimeType: z.string().optional(),
  })).default([]),
})

export const updateFragmentSchema = createFragmentSchema.partial()

export const searchFragmentsSchema = z.object({
  q: z.string().default(''),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  visibility: z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']).optional(),
  tags: z.array(z.string()).optional(),
  emotions: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

// Collection schemas
export const createCollectionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
})

export const addToCollectionSchema = z.object({
  fragmentId: z.string().uuid(),
  position: z.number().int().min(0).optional(),
})

// Upload schemas
export const createUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().min(1).max(100 * 1024 * 1024), // 100MB max
})

// Link schemas
export const recomputeLinksSchema = z.object({
  fragmentId: z.string().uuid(),
})

// Consent schemas
export const updateConsentSchema = z.object({
  shareForResearch: z.boolean().optional(),
  allowModelTraining: z.boolean().optional(),
  receiveStudyInvites: z.boolean().optional(),
})

// Export schemas
export const exportDataSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  includeMedia: z.boolean().default(false),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

// Audit schemas
export const auditActionSchema = z.object({
  action: z.string().min(1),
  subjectId: z.string().uuid().optional(),
  meta: z.record(z.any()).default({}),
})

export type CreateFragmentInput = z.infer<typeof createFragmentSchema>
export type UpdateFragmentInput = z.infer<typeof updateFragmentSchema>
export type SearchFragmentsInput = z.infer<typeof searchFragmentsSchema>
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type AddToCollectionInput = z.infer<typeof addToCollectionSchema>
export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>
export type RecomputeLinksInput = z.infer<typeof recomputeLinksSchema>
export type UpdateConsentInput = z.infer<typeof updateConsentSchema>
export type ExportDataInput = z.infer<typeof exportDataSchema>
export type AuditActionInput = z.infer<typeof auditActionSchema>
