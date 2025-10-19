export type TimeRange = 'week' | 'month' | 'custom';

export type ExportFormat = 'pdf' | 'json';

export interface ContentInsight {
  category: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  keywords: string[];
  percentage: number;
}

export interface TimeInsight {
  completion_rate: number;
  overdue_rate: number;
  avg_completion_time_hours: number;
  peak_working_hours: number[];
  trend: 'improving' | 'declining' | 'stable';
}

export interface ProductivityInsight {
  tasks_per_day: number;
  completion_trend: 'increasing' | 'decreasing' | 'stable';
  peak_days: string[];
  efficiency_score: number;
}

export interface ComparisonData {
  current_period: Record<string, any>;
  previous_period: Record<string, any>;
  change_percentage: number;
  improvement_areas: string[];
  declining_areas: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'time_management' | 'productivity' | 'content_organization';
}

export interface AnalysisRequest {
  time_range: TimeRange;
  compare_with_previous: boolean;
  custom_start_date?: string;
  custom_end_date?: string;
}

export interface AnalysisResponse {
  user_id: string;
  time_range: TimeRange;
  generated_at: string;
  content: ContentInsight;
  time: TimeInsight;
  productivity: ProductivityInsight;
  comparison?: ComparisonData;
  recommendations: Recommendation[];
  confidence_score: number;
  total_todos_analyzed: number;
}

export interface ExportRequest {
  format: ExportFormat;
  include_charts: boolean;
  time_range: TimeRange;
}

export interface ExportResponse {
  download_url?: string;
  data?: Record<string, any>;
  filename: string;
  generated_at: string;
  file_size_bytes?: number;
}

export interface AnalysisHistoryItem {
  id: string;
  time_range: TimeRange;
  generated_at: string;
  confidence_score: number;
  total_todos: number;
  key_insights: string[];
}

export interface AnalysisHistoryResponse {
  items: AnalysisHistoryItem[];
  total: number;
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  analysisData: AnalysisResponse | null;
  isGenerating: boolean;
  isExporting: boolean;
}
