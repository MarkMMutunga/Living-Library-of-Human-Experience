export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_user: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
      audit_event: {
        Row: {
          id: string
          user_id: string | null
          action: string
          subject_id: string | null
          meta: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          subject_id?: string | null
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          subject_id?: string | null
          meta?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_event_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          }
        ]
      }
      collection: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          }
        ]
      }
      collection_item: {
        Row: {
          id: string
          collection_id: string
          fragment_id: string
          position: number
        }
        Insert: {
          id?: string
          collection_id: string
          fragment_id: string
          position: number
        }
        Update: {
          id?: string
          collection_id?: string
          fragment_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_item_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_item_fragment_id_fkey"
            columns: ["fragment_id"]
            isOneToOne: false
            referencedRelation: "fragment"
            referencedColumns: ["id"]
          }
        ]
      }
      consent: {
        Row: {
          id: string
          user_id: string
          share_for_research: boolean
          allow_model_training: boolean
          receive_study_invites: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          share_for_research?: boolean
          allow_model_training?: boolean
          receive_study_invites?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          share_for_research?: boolean
          allow_model_training?: boolean
          receive_study_invites?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          }
        ]
      }
      fragment: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          transcript: string
          event_at: string
          location_text: string | null
          lat: number | null
          lng: number | null
          visibility: Database['public']['Enums']['visibility']
          tags: string[]
          system_emotions: string[]
          system_themes: string[]
          life_stage: string | null
          media: Json
          embedding: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          transcript?: string
          event_at: string
          location_text?: string | null
          lat?: number | null
          lng?: number | null
          visibility?: Database['public']['Enums']['visibility']
          tags?: string[]
          system_emotions?: string[]
          system_themes?: string[]
          life_stage?: string | null
          media?: Json
          embedding?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          transcript?: string
          event_at?: string
          location_text?: string | null
          lat?: number | null
          lng?: number | null
          visibility?: Database['public']['Enums']['visibility']
          tags?: string[]
          system_emotions?: string[]
          system_themes?: string[]
          life_stage?: string | null
          media?: Json
          embedding?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fragment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          }
        ]
      }
      link: {
        Row: {
          id: string
          from_id: string
          to_id: string
          type: Database['public']['Enums']['link_type']
          score: number
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          from_id: string
          to_id: string
          type: Database['public']['Enums']['link_type']
          score: number
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          from_id?: string
          to_id?: string
          type?: Database['public']['Enums']['link_type']
          score?: number
          reason?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "fragment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "fragment"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_rule_links: {
        Args: {
          fragment_id: string
        }
        Returns: undefined
      }
      create_semantic_links: {
        Args: {
          fragment_id: string
        }
        Returns: undefined
      }
      find_fragment_neighbors: {
        Args: {
          fragment_id: string
          k?: number
        }
        Returns: {
          id: string
          similarity: number
        }[]
      }
      search_fragments: {
        Args: {
          query_text: string
          query_embedding?: string
          user_id_filter?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          title: string
          body: string
          event_at: string
          location_text: string
          tags: string[]
          system_emotions: string[]
          system_themes: string[]
          visibility: Database['public']['Enums']['visibility']
          similarity: number
          rank: number
        }[]
      }
    }
    Enums: {
      link_type: "SEMANTIC" | "SHARED_TAG" | "SAME_TIMEWINDOW" | "SAME_LOCATION"
      visibility: "PRIVATE" | "UNLISTED" | "PUBLIC"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Fragment = Database['public']['Tables']['fragment']['Row']
export type FragmentInsert = Database['public']['Tables']['fragment']['Insert']
export type FragmentUpdate = Database['public']['Tables']['fragment']['Update']

export type Link = Database['public']['Tables']['link']['Row']
export type LinkInsert = Database['public']['Tables']['link']['Insert']

export type Collection = Database['public']['Tables']['collection']['Row']
export type CollectionInsert = Database['public']['Tables']['collection']['Insert']

export type CollectionItem = Database['public']['Tables']['collection_item']['Row']
export type CollectionItemInsert = Database['public']['Tables']['collection_item']['Insert']

export type AppUser = Database['public']['Tables']['app_user']['Row']
export type Consent = Database['public']['Tables']['consent']['Row']
export type AuditEvent = Database['public']['Tables']['audit_event']['Row']

export type Visibility = Database['public']['Enums']['visibility']
export type LinkType = Database['public']['Enums']['link_type']

// Media types for fragments
export interface MediaItem {
  url: string
  type: 'image' | 'audio' | 'video'
  duration?: number
  size?: number
  mimeType?: string
}

// Search result with relevance
export interface SearchResult extends Fragment {
  similarity: number
  rank: number
}

// Fragment with related data
export interface FragmentWithLinks extends Fragment {
  links: (Link & { to_fragment: Fragment })[]
  collections?: Collection[]
}
