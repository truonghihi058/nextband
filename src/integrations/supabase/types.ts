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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer_audio_url: string | null
          answer_text: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          submission_id: string
          teacher_feedback: string | null
        }
        Insert: {
          answer_audio_url?: string | null
          answer_text?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          submission_id: string
          teacher_feedback?: string | null
        }
        Update: {
          answer_audio_url?: string | null
          answer_text?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          submission_id?: string
          teacher_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "exam_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          level: Database["public"]["Enums"]["course_level"]
          price: number | null
          syllabus: Json | null
          teacher_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["course_level"]
          price?: number | null
          syllabus?: Json | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["course_level"]
          price?: number | null
          syllabus?: Json | null
          teacher_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          progress_percent: number | null
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percent?: number | null
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percent?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sections: {
        Row: {
          audio_url: string | null
          created_at: string
          duration_minutes: number | null
          exam_id: string
          id: string
          instructions: string | null
          order_index: number | null
          passage_text: string | null
          prompt_text: string | null
          section_type: Database["public"]["Enums"]["exam_section_type"]
          title: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration_minutes?: number | null
          exam_id: string
          id?: string
          instructions?: string | null
          order_index?: number | null
          passage_text?: string | null
          prompt_text?: string | null
          section_type: Database["public"]["Enums"]["exam_section_type"]
          title: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration_minutes?: number | null
          exam_id?: string
          id?: string
          instructions?: string | null
          order_index?: number | null
          passage_text?: string | null
          prompt_text?: string | null
          section_type?: Database["public"]["Enums"]["exam_section_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sections_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_submissions: {
        Row: {
          created_at: string
          exam_id: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          listening_score: number | null
          overall_score: number | null
          reading_score: number | null
          speaking_score: number | null
          started_at: string
          status: Database["public"]["Enums"]["submission_status"] | null
          student_id: string
          submitted_at: string | null
          writing_score: number | null
        }
        Insert: {
          created_at?: string
          exam_id: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          listening_score?: number | null
          overall_score?: number | null
          reading_score?: number | null
          speaking_score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"] | null
          student_id: string
          submitted_at?: string | null
          writing_score?: number | null
        }
        Update: {
          created_at?: string
          exam_id?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          listening_score?: number | null
          overall_score?: number | null
          reading_score?: number | null
          speaking_score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"] | null
          student_id?: string
          submitted_at?: string | null
          writing_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          color: string | null
          created_at: string
          end_index: number
          id: string
          section_id: string
          start_index: number
          student_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          end_index: number
          id?: string
          section_id: string
          start_index: number
          student_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          end_index?: number
          id?: string
          section_id?: string
          start_index?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "exam_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          avg_listening_score: number | null
          avg_overall_score: number | null
          avg_reading_score: number | null
          avg_speaking_score: number | null
          avg_writing_score: number | null
          id: string
          last_exam_date: string | null
          student_id: string
          total_exams_taken: number | null
          updated_at: string
        }
        Insert: {
          avg_listening_score?: number | null
          avg_overall_score?: number | null
          avg_reading_score?: number | null
          avg_speaking_score?: number | null
          avg_writing_score?: number | null
          id?: string
          last_exam_date?: string | null
          student_id: string
          total_exams_taken?: number | null
          updated_at?: string
        }
        Update: {
          avg_listening_score?: number | null
          avg_overall_score?: number | null
          avg_reading_score?: number | null
          avg_speaking_score?: number | null
          avg_writing_score?: number | null
          id?: string
          last_exam_date?: string | null
          student_id?: string
          total_exams_taken?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_groups: {
        Row: {
          audio_end_time: number | null
          audio_start_time: number | null
          created_at: string
          id: string
          instructions: string | null
          order_index: number | null
          passage_end_index: number | null
          passage_start_index: number | null
          section_id: string
          title: string | null
        }
        Insert: {
          audio_end_time?: number | null
          audio_start_time?: number | null
          created_at?: string
          id?: string
          instructions?: string | null
          order_index?: number | null
          passage_end_index?: number | null
          passage_start_index?: number | null
          section_id: string
          title?: string | null
        }
        Update: {
          audio_end_time?: number | null
          audio_start_time?: number | null
          created_at?: string
          id?: string
          instructions?: string | null
          order_index?: number | null
          passage_end_index?: number | null
          passage_start_index?: number | null
          section_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_groups_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "exam_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          group_id: string
          id: string
          options: Json | null
          order_index: number | null
          points: number | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          group_id: string
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          group_id?: string
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "question_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      task_responses: {
        Row: {
          audio_url: string | null
          created_at: string
          duration_seconds: number | null
          graded_at: string | null
          id: string
          response_text: string | null
          score: number | null
          section_id: string
          submission_id: string
          teacher_feedback: string | null
          word_count: number | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          graded_at?: string | null
          id?: string
          response_text?: string | null
          score?: number | null
          section_id: string
          submission_id: string
          teacher_feedback?: string | null
          word_count?: number | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          graded_at?: string | null
          id?: string
          response_text?: string | null
          score?: number | null
          section_id?: string
          submission_id?: string
          teacher_feedback?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_responses_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "exam_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_responses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "exam_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      course_level:
        | "beginner"
        | "intermediate"
        | "ielts_5"
        | "ielts_5_5"
        | "ielts_6"
        | "ielts_6_5"
        | "ielts_7"
        | "ielts_7_5"
        | "ielts_8"
        | "ielts_8_5"
        | "ielts_9"
      exam_section_type: "listening" | "reading" | "writing" | "speaking"
      question_type:
        | "multiple_choice"
        | "fill_blank"
        | "matching"
        | "true_false_not_given"
        | "short_answer"
        | "essay"
        | "speaking_task"
      submission_status:
        | "in_progress"
        | "submitted"
        | "graded"
        | "pending_grading"
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
    Enums: {
      app_role: ["admin", "teacher", "student"],
      course_level: [
        "beginner",
        "intermediate",
        "ielts_5",
        "ielts_5_5",
        "ielts_6",
        "ielts_6_5",
        "ielts_7",
        "ielts_7_5",
        "ielts_8",
        "ielts_8_5",
        "ielts_9",
      ],
      exam_section_type: ["listening", "reading", "writing", "speaking"],
      question_type: [
        "multiple_choice",
        "fill_blank",
        "matching",
        "true_false_not_given",
        "short_answer",
        "essay",
        "speaking_task",
      ],
      submission_status: [
        "in_progress",
        "submitted",
        "graded",
        "pending_grading",
      ],
    },
  },
} as const
