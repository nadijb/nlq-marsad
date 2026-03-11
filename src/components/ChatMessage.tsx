'use client'

import { Message } from '@/types/chat'
import MarkdownRenderer from './MarkdownRenderer'
import ChartRenderer from './ChartRenderer'

interface ChatMessageProps {
  message: Message
}

function AIAvatar() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm mt-0.5">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
  )
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isChart = message.responseType === 'chart' && message.chartData

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[80%] md:max-w-[70%] lg:max-w-[60%] bg-primary text-white rounded-2xl rounded-br-sm shadow-sm px-4 py-3">
          {message.isVoice ? (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-12a3 3 0 00-3 3v4a3 3 0 006 0V8a3 3 0 00-3-3z"
                />
              </svg>
              <span className="font-medium">Voice message</span>
            </div>
          ) : (
            <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 mb-5 ${isChart ? 'w-full' : ''}`}>
      <AIAvatar />
      <div className={`${isChart ? 'flex-1 min-w-0' : 'max-w-[82%]'} bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 overflow-hidden`}>
        {isChart ? (
          <>
            <ChartRenderer
              chartType={message.chartData!.type}
              data={message.chartData!.data}
            />
            {message.analysis && (
              <div className="mx-3 mb-3 rounded-xl overflow-hidden border border-blue-100 bg-blue-50/50">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-100 bg-white/60">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Analysis</span>
                </div>
                <div className="px-4 py-3">
                  <MarkdownRenderer content={message.analysis} className="analysis-content" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-4 py-3">
            <MarkdownRenderer content={message.content} />
          </div>
        )}
      </div>
    </div>
  )
}
