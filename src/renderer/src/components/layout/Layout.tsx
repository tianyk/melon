import React from 'react'
import Sidebar from '@/components/sidebar/SessionList'
import { ChatView } from '@/pages/ChatView'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatView />
      </main>
    </div>
  )
}
