'use client'

import { Message } from '@/types/chat'
import MarkdownRenderer from './MarkdownRenderer'
import ChartRenderer from './ChartRenderer'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isChart = message.responseType === 'chart' && message.chartData

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`${
          isChart
            ? 'w-full'
            : 'max-w-[85%] md:max-w-[75%] lg:max-w-[65%]'
        } ${
          isUser
            ? 'bg-primary text-white rounded-2xl rounded-br-md'
            : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm'
        }`}
      >
        <div className={`px-4 py-3 ${isUser ? 'text-white' : ''}`}>
          {isUser ? (
            message.isVoice ? (
              <div className="flex items-center gap-2 text-sm md:text-base">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-12a3 3 0 00-3 3v4a3 3 0 006 0V8a3 3 0 00-3-3z"
                  />
                </svg>
                <span>Voice message</span>
              </div>
            ) : (
              <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
            )
          ) : (
            <>
              {isChart ? (
                <div className="space-y-4">
                  <ChartRenderer
                    chartType={message.chartData!.type}
                    data={message.chartData!.data}
                  />
                  {message.analysis && (
                    <div className="border-t border-gray-100 pt-4">
                      <MarkdownRenderer content={message.analysis} />
                    </div>
                  )}
                </div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
