export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_products: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          file_url: string | null
          id: string
          image_url: string | null
          price: number
          product_type: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          price: number
          product_type?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          price?: number
          product_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number
          booking_date: string
          booking_time: string
          created_at: string
          currency: string | null
          custom_time: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          product_service_id: string | null
          provider_id: string | null
          service_id: string | null
          service_location: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          booking_date: string
          booking_time: string
          created_at?: string
          currency?: string | null
          custom_time?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_service_id?: string | null
          provider_id?: string | null
          service_id?: string | null
          service_location?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_date?: string
          booking_time?: string
          created_at?: string
          currency?: string | null
          custom_time?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_service_id?: string | null
          provider_id?: string | null
          service_id?: string | null
          service_location?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_product_service_id_fkey"
            columns: ["product_service_id"]
            isOneToOne: false
            referencedRelation: "product_services"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          product_id: string | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          product_id?: string | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "secure_products"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations_v2: {
        Row: {
          created_at: string
          id: string
          is_support_ticket: boolean | null
          status: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_support_ticket?: boolean | null
          status?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_support_ticket?: boolean | null
          status?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          base_currency: string
          id: string
          rate: number
          target_currency: string
          updated_at: string
        }
        Insert: {
          base_currency?: string
          id?: string
          rate: number
          target_currency: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          id?: string
          rate?: number
          target_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      download_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          order_id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      email_performance_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          processing_time_ms: number | null
          recipient_email: string
          success: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          recipient_email: string
          success?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          recipient_email?: string
          success?: boolean | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_v2: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_from_support: boolean | null
          sender_email: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_from_support?: boolean | null
          sender_email?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_from_support?: boolean | null
          sender_email?: string | null
          sender_id?: string | null
        }
        Relationships: []
      }
      news_updates: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          id: string
          is_published: boolean | null
          priority: string | null
          published_at: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          priority?: string | null
          published_at?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          priority?: string | null
          published_at?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking_history: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_id: string
          status: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          buyer_id: string
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          delivered_at: string | null
          delivery_email: string | null
          email_sent: boolean | null
          id: string
          payment_gateway: string | null
          payment_method: string | null
          paystack_reference: string | null
          product_id: string
          seller_amount: number | null
          shipped_at: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          delivered_at?: string | null
          delivery_email?: string | null
          email_sent?: boolean | null
          id?: string
          payment_gateway?: string | null
          payment_method?: string | null
          paystack_reference?: string | null
          product_id: string
          seller_amount?: number | null
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          delivered_at?: string | null
          delivery_email?: string | null
          email_sent?: boolean | null
          id?: string
          payment_gateway?: string | null
          payment_method?: string | null
          paystack_reference?: string | null
          product_id?: string
          seller_amount?: number | null
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "secure_products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_splits: {
        Row: {
          booking_id: string | null
          created_at: string | null
          currency: string
          id: string
          payment_gateway: string | null
          payment_reference: string | null
          platform_amount: number
          platform_paid: boolean | null
          platform_percentage: number
          provider_amount: number
          provider_paid: boolean | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          payment_gateway?: string | null
          payment_reference?: string | null
          platform_amount: number
          platform_paid?: boolean | null
          platform_percentage?: number
          provider_amount: number
          provider_paid?: boolean | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          payment_gateway?: string | null
          payment_reference?: string | null
          platform_amount?: number
          platform_paid?: boolean | null
          platform_percentage?: number
          provider_amount?: number
          provider_paid?: boolean | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_splits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_splits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_splits_new: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          order_id: string | null
          payment_gateway: string | null
          platform_amount: number
          platform_paid: boolean | null
          platform_reference: string | null
          product_id: string
          seller_amount: number
          seller_paid: boolean | null
          seller_reference: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_gateway?: string | null
          platform_amount: number
          platform_paid?: boolean | null
          platform_reference?: string | null
          product_id: string
          seller_amount: number
          seller_paid?: boolean | null
          seller_reference?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_gateway?: string | null
          platform_amount?: number
          platform_paid?: boolean | null
          platform_reference?: string | null
          product_id?: string
          seller_amount?: number
          seller_paid?: boolean | null
          seller_reference?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_splits_new_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "secure_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_messages: {
        Row: {
          buyer_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          product_id: string
          seller_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          product_id: string
          seller_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          product_id?: string
          seller_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "secure_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "secure_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          price: number
          provider_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          price: number
          provider_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          price?: number
          provider_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          image_url: string | null
          price: number
          product_type: string | null
          seller_id: string
          shipping_cost: number | null
          shipping_required: boolean | null
          status: string | null
          title: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          price: number
          product_type?: string | null
          seller_id: string
          shipping_cost?: number | null
          shipping_required?: boolean | null
          status?: string | null
          title: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          price?: number
          product_type?: string | null
          seller_id?: string
          shipping_cost?: number | null
          shipping_required?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          account_name: string | null
          account_number: string | null
          apple_calendar_token: string | null
          availability_status: string | null
          avatar_url: string | null
          average_rating: number | null
          bank_code: string | null
          bank_name: string | null
          bio: string | null
          business_name: string | null
          certifications: string[] | null
          commission_rate: number | null
          completed_bookings: number | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          education: string | null
          full_name: string | null
          google_calendar_token: string | null
          hourly_rate: number | null
          id: string
          identity_document_type: string | null
          identity_document_url: string | null
          identity_verified: boolean | null
          is_provider: boolean | null
          is_seller: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          location: string | null
          payment_methods: string[] | null
          paystack_subaccount_code: string | null
          phone: string | null
          phone_number: string | null
          portfolio_urls: string[] | null
          preferred_currency: string | null
          preferred_payment_method: string | null
          product_view_preference: string | null
          profile_image_url: string | null
          provider_phone: string | null
          region: string | null
          routing_number: string | null
          skills: string[] | null
          social_links: Json | null
          specialties: string[] | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          user_role: string | null
          verification_date: string | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          about?: string | null
          account_name?: string | null
          account_number?: string | null
          apple_calendar_token?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bank_code?: string | null
          bank_name?: string | null
          bio?: string | null
          business_name?: string | null
          certifications?: string[] | null
          commission_rate?: number | null
          completed_bookings?: number | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          education?: string | null
          full_name?: string | null
          google_calendar_token?: string | null
          hourly_rate?: number | null
          id?: string
          identity_document_type?: string | null
          identity_document_url?: string | null
          identity_verified?: boolean | null
          is_provider?: boolean | null
          is_seller?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location?: string | null
          payment_methods?: string[] | null
          paystack_subaccount_code?: string | null
          phone?: string | null
          phone_number?: string | null
          portfolio_urls?: string[] | null
          preferred_currency?: string | null
          preferred_payment_method?: string | null
          product_view_preference?: string | null
          profile_image_url?: string | null
          provider_phone?: string | null
          region?: string | null
          routing_number?: string | null
          skills?: string[] | null
          social_links?: Json | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          user_role?: string | null
          verification_date?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          about?: string | null
          account_name?: string | null
          account_number?: string | null
          apple_calendar_token?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bank_code?: string | null
          bank_name?: string | null
          bio?: string | null
          business_name?: string | null
          certifications?: string[] | null
          commission_rate?: number | null
          completed_bookings?: number | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          education?: string | null
          full_name?: string | null
          google_calendar_token?: string | null
          hourly_rate?: number | null
          id?: string
          identity_document_type?: string | null
          identity_document_url?: string | null
          identity_verified?: boolean | null
          is_provider?: boolean | null
          is_seller?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location?: string | null
          payment_methods?: string[] | null
          paystack_subaccount_code?: string | null
          phone?: string | null
          phone_number?: string | null
          portfolio_urls?: string[] | null
          preferred_currency?: string | null
          preferred_payment_method?: string | null
          product_view_preference?: string | null
          profile_image_url?: string | null
          provider_phone?: string | null
          region?: string | null
          routing_number?: string | null
          skills?: string[] | null
          social_links?: Json | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          user_role?: string | null
          verification_date?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      provider_schedules: {
        Row: {
          created_at: string
          day_of_week: number | null
          end_time: string
          id: string
          is_available: boolean | null
          provider_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          end_time: string
          id?: string
          is_available?: boolean | null
          provider_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          provider_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          provider_id: string | null
          rating: number | null
          reviewer_id: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string | null
          rating?: number | null
          reviewer_id?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string | null
          rating?: number | null
          reviewer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      service_conversations: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          provider_id: string
          service_id: string | null
          status: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          provider_id: string
          service_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          provider_id?: string
          service_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_conversations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "product_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "service_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          price: number
          provider_id: string | null
          regions: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price: number
          provider_id?: string | null
          regions?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number
          provider_id?: string | null
          regions?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_from_support: boolean | null
          sender_email: string | null
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_from_support?: boolean | null
          sender_email?: string | null
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_from_support?: boolean | null
          sender_email?: string | null
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      booking_history: {
        Row: {
          amount: number | null
          booking_date: string | null
          booking_time: string | null
          created_at: string | null
          currency: string | null
          custom_time: string | null
          customer_name: string | null
          id: string | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          product_service_id: string | null
          provider_id: string | null
          provider_name: string | null
          provider_phone: string | null
          service_description: string | null
          service_id: string | null
          service_location: string | null
          service_title: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_product_service_id_fkey"
            columns: ["product_service_id"]
            isOneToOne: false
            referencedRelation: "product_services"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_profiles: {
        Row: {
          about: string | null
          availability_status: string | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          certifications: string[] | null
          completed_bookings: number | null
          created_at: string | null
          currency: string | null
          education: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string | null
          is_provider: boolean | null
          is_seller: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          location: string | null
          portfolio_urls: string[] | null
          preferred_currency: string | null
          profile_image_url: string | null
          region: string | null
          skills: string[] | null
          specialties: string[] | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          user_role: string | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          about?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          certifications?: string[] | null
          completed_bookings?: number | null
          created_at?: string | null
          currency?: string | null
          education?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_provider?: boolean | null
          is_seller?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location?: string | null
          portfolio_urls?: string[] | null
          preferred_currency?: string | null
          profile_image_url?: string | null
          region?: string | null
          skills?: string[] | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_role?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          about?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          certifications?: string[] | null
          completed_bookings?: number | null
          created_at?: string | null
          currency?: string | null
          education?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_provider?: boolean | null
          is_seller?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location?: string | null
          portfolio_urls?: string[] | null
          preferred_currency?: string | null
          profile_image_url?: string | null
          region?: string | null
          skills?: string[] | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_role?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      secure_admin_products: {
        Row: {
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          file_url: string | null
          id: string | null
          image_url: string | null
          price: number | null
          product_type: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          file_url?: never
          id?: string | null
          image_url?: string | null
          price?: number | null
          product_type?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          file_url?: never
          id?: string | null
          image_url?: string | null
          price?: number | null
          product_type?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      secure_products: {
        Row: {
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string | null
          image_url: string | null
          price: number | null
          product_type: string | null
          seller_id: string | null
          shipping_cost: number | null
          shipping_required: boolean | null
          status: string | null
          title: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: never
          id?: string | null
          image_url?: string | null
          price?: number | null
          product_type?: string | null
          seller_id?: string | null
          shipping_cost?: number | null
          shipping_required?: boolean | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: never
          id?: string | null
          image_url?: string | null
          price?: number | null
          product_type?: string | null
          seller_id?: string | null
          shipping_cost?: number | null
          shipping_required?: boolean | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      clear_pending_tracking_history: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      generate_download_token: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: string
      }
      get_booking_history_for_user: {
        Args: { user_uuid: string }
        Returns: {
          amount: number
          booking_date: string
          booking_time: string
          created_at: string
          currency: string
          custom_time: string
          customer_name: string
          id: string
          notes: string
          payment_method: string
          payment_status: string
          product_service_id: string
          provider_id: string
          provider_name: string
          provider_phone: string
          service_description: string
          service_id: string
          service_location: string
          service_title: string
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      get_currency_for_region: {
        Args: { region_code: string }
        Returns: string
      }
      get_digital_product_access: {
        Args: { order_uuid: string }
        Returns: {
          access_granted: boolean
          order_status: string
          product_title: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      validate_download_token: {
        Args: { p_token: string; p_user_id: string }
        Returns: {
          file_url: string
          order_id: string
          product_id: string
          product_title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
