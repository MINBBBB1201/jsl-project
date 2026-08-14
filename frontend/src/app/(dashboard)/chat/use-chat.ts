"use client"

import { create } from "zustand"

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  status: "online" | "away" | "offline"
  lastSeen: string
  role: string
  department: string
}

export interface Message {
  id: string
  content: string
  timestamp: string
  senderId: string
  type: "text" | "image" | "file"
  isEdited: boolean
  reactions: Array<{
    emoji: string
    users: string[]
    count: number
  }>
  replyTo: string | null
}

export interface Conversation {
  id: string
  type: "direct" | "group"
  participants: string[]
  name: string
  avatar: string
  lastMessage: {
    id: string
    content: string
    timestamp: string
    senderId: string
  }
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
}

/**
 * 목업용 온라인 상태.
 *
 * 기존에는 렌더 중 Math.random()을 호출해서 리렌더마다 값이 바뀌었고
 * (온라인 표시등이 깜빡이는 버그) react-hooks/purity 규칙에도 걸렸습니다.
 * conversation.id 해시 기반으로 바꿔 순수하고 결정적인 값이 되도록 했습니다.
 *
 * TODO: 실제 사용자 온라인 상태 API 연동 시 교체
 */
export function getMockOnlineStatus(conversation: Conversation): boolean {
  if (conversation.type !== "direct" || conversation.participants.length !== 1) {
    return false
  }

  let hash = 0
  for (let i = 0; i < conversation.id.length; i++) {
    hash = (hash * 31 + conversation.id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 2 === 0
}

interface ChatState {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  users: User[]
  selectedConversation: string | null
  searchQuery: string
  isTyping: Record<string, boolean>
  onlineUsers: string[]
}

interface ChatActions {
  setConversations: (conversations: Conversation[]) => void
  setMessages: (conversationId: string, messages: Message[]) => void
  setUsers: (users: User[]) => void
  setSelectedConversation: (conversationId: string | null) => void
  setSearchQuery: (query: string) => void
  addMessage: (conversationId: string, message: Message) => void
  markAsRead: (conversationId: string) => void
  togglePin: (conversationId: string) => void
  toggleMute: (conversationId: string) => void
  setTyping: (conversationId: string, isTyping: boolean) => void
  setOnlineUsers: (userIds: string[]) => void
}

export const useChat = create<ChatState & ChatActions>((set, get) => ({
  // State
  conversations: [],
  messages: {},
  users: [],
  selectedConversation: null,
  searchQuery: "",
  isTyping: {},
  onlineUsers: [],

  // Actions
  setConversations: (conversations) => set({ conversations }),
  
  setMessages: (conversationId, messages) => 
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages }
    })),
  
  setUsers: (users) => set({ users }),
  
  setSelectedConversation: (conversationId) => {
    set({ selectedConversation: conversationId })
    if (conversationId) {
      get().markAsRead(conversationId)
    }
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message]
      },
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: {
                id: message.id,
                content: message.content,
                timestamp: message.timestamp,
                senderId: message.senderId
              }
            }
          : conv
      )
    })),
  
  markAsRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    })),
  
  togglePin: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
      )
    })),
  
  toggleMute: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isMuted: !conv.isMuted } : conv
      )
    })),
  
  setTyping: (conversationId, isTyping) =>
    set((state) => ({
      isTyping: { ...state.isTyping, [conversationId]: isTyping }
    })),
  
  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),
}))
