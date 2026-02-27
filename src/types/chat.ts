export interface TextResponse {
  type: 'text'
  text: {
    value: string
  }
}

export interface ChartDataValue {
  [key: string]: string | number
}

export interface ChartData {
  nameKey: string
  valueKey: string
  values: ChartDataValue[]
  xAxisKey?: string
  yAxisKey?: string
  lines?: { dataKey: string; stroke?: string; name?: string }[]
  bars?: { dataKey: string; fill?: string; name?: string }[]
}

export interface ChartResponse {
  type: 'chart'
  chart: {
    type: string
    data: ChartData
  }
  analysis?: {
    value: string
  }
}

export type ResponseData = TextResponse | ChartResponse

export interface ApiResponse {
  status: 'success' | 'error'
  data?: ResponseData
  message?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  responseType?: 'text' | 'chart'
  chartData?: ChartResponse['chart']
  analysis?: string
  isVoice?: boolean
  timestamp: Date
}

// Session types
export interface Session {
  session_id: string
}

export interface RawMessage {
  id: string
  author: 'AI' | 'USER'
  content: string
  created_at: string
  session_id: string
}

export interface SessionsListResponse {
  status: 'success' | 'error'
  data?: {
    sessions: Session[]
  }
  message?: string
}

export interface SessionMessagesResponse {
  status: 'success' | 'error'
  data?: {
    sessions: {
      messages: RawMessage[]
    }
  }
  message?: string
}
