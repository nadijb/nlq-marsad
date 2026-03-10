import { Suspense } from 'react'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense>
        <ChatInterface />
      </Suspense>
    </main>
  )
}
