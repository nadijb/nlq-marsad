'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      <div className="typing-dot w-2 h-2 bg-gray-300 rounded-full" />
      <div className="typing-dot w-2 h-2 bg-gray-300 rounded-full" />
      <div className="typing-dot w-2 h-2 bg-gray-300 rounded-full" />
    </div>
  )
}
