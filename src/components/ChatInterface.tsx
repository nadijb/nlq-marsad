"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Logo from "./Logo";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import SessionsSidebar from "./SessionsSidebar";
import {
  Message,
  ApiResponse,
  TextResponse,
  ChartResponse,
  RawMessage,
  SessionMessagesResponse,
} from "@/types/chat";

function generateSessionId(): string {
  return `session_${uuidv4().replace(/-/g, "").substring(0, 9)}`;
}

function parseAIContent(content: string): {
  type: "text" | "chart";
  text?: string;
  chartData?: ChartResponse["chart"];
  comment?: string;
} {
  try {
    const parsed = JSON.parse(content);
    // Check if it looks like chart data (has type and data properties)
    if (parsed.type && parsed.data) {
      return {
        type: "chart",
        chartData: {
          type: parsed.type,
          data: parsed.data,
        },
        comment: parsed.comment || undefined,
      };
    }
    // Not chart data, treat as text
    return { type: "text", text: content };
  } catch {
    // Not JSON, treat as plain text
    return { type: "text", text: content };
  }
}

function convertRawMessageToMessage(rawMessage: RawMessage): Message {
  const isUser = rawMessage.author === "USER";

  if (isUser) {
    return {
      id: rawMessage.id,
      role: "user",
      content: rawMessage.content,
      timestamp: new Date(rawMessage.created_at),
    };
  }

  // AI message - determine if it's text or chart
  const parsed = parseAIContent(rawMessage.content);

  if (parsed.type === "chart" && parsed.chartData) {
    const analysis = parsed.comment || rawMessage.comment || undefined;
    return {
      id: rawMessage.id,
      role: "assistant",
      content: analysis || "",
      responseType: "chart",
      chartData: parsed.chartData,
      analysis,
      timestamp: new Date(rawMessage.created_at),
    };
  }

  return {
    id: rawMessage.id,
    role: "assistant",
    content: parsed.text || rawMessage.content,
    responseType: "text",
    timestamp: new Date(rawMessage.created_at),
  };
}

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // On mount: if ?session_id= is in the URL, load that session and open sidebar
  useEffect(() => {
    const urlSessionId = searchParams.get("session_id");
    if (urlSessionId) {
      loadSessionMessages(urlSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with the active session
  useEffect(() => {
    if (sessionId) {
      router.replace(`?session_id=${sessionId}`, { scroll: false });
    } else {
      router.replace("/", { scroll: false });
    }
  }, [sessionId, router]);

  const loadSessionMessages = async (selectedSessionId: string) => {
    setIsLoadingHistory(true);
    setMessages([]);
    setSessionId(selectedSessionId);

    try {
      const response = await fetch(`/api/sessions?id=${selectedSessionId}`);
      const data: SessionMessagesResponse = await response.json();

      if (data.status === "success" && data.data?.sessions?.messages) {
        // Messages come in reverse order (newest first), so we reverse them
        const rawMessages = [...data.data.sessions.messages].reverse();
        const convertedMessages = rawMessages.map(convertRawMessageToMessage);
        setMessages(convertedMessages);
      }
    } catch (error) {
      console.error("Error loading session messages:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleApiResponse = async (
    response: Response,
    fallbackError: string,
  ) => {
    const data: ApiResponse = await response.json();

    if (data.status === "success" && data.data) {
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      if (data.data.type === "text") {
        const textData = data.data as TextResponse;
        assistantMessage.content = textData.text.value;
        assistantMessage.responseType = "text";
      } else if (data.data.type === "chart") {
        const chartData = data.data as ChartResponse;
        assistantMessage.responseType = "chart";
        assistantMessage.chartData = chartData.chart;
        assistantMessage.analysis = chartData.analysis?.value;
        assistantMessage.content = chartData.analysis?.value || "";
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: data.message || fallbackError,
          responseType: "text",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const currentSessionId = sessionId || generateSessionId();
    if (!sessionId) {
      setSessionId(currentSessionId);
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: currentSessionId,
          message: userMessage.content,
        }),
      });

      await handleApiResponse(
        response,
        "Sorry, I encountered an error processing your request. Please try again.",
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
          responseType: "text",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    const currentSessionId = sessionId || generateSessionId();
    if (!sessionId) {
      setSessionId(currentSessionId);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        role: "user",
        content: "Voice message",
        isVoice: true,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);

    try {
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: currentSessionId,
          message: "",
          audio: base64Audio,
        }),
      });

      await handleApiResponse(
        response,
        "Sorry, I encountered an error processing your voice message. Please try again.",
      );
    } catch (error) {
      console.error("Error sending voice message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your voice message. Please try again.",
          responseType: "text",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Sessions Sidebar */}
      <SessionsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectSession={loadSessionMessages}
        onDeleteSession={handleNewChat}
        currentSessionId={sessionId}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-[0_1px_12px_rgba(0,0,0,0.06)] z-10">
        <div className="flex items-center gap-3">
          {/* Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/6 rounded-xl transition-all duration-150"
            aria-label="Open chat history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Logo width={96} height={36} />
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-gray-200">
            <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm shadow-emerald-300" />
            <span className="text-xs text-gray-400 font-medium">AI Online</span>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-primary border border-primary/25 bg-primary/5 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 chat-background">
        <div className="max-w-4xl mx-auto">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
              <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-400 font-medium">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
              {/* Hero icon */}
              <div className="relative mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Logo width={36} height={36} />
                </div>
                <div className="absolute -inset-2 rounded-3xl border border-primary/15 pointer-events-none" />
                <div className="absolute -inset-4 rounded-3xl border border-primary/8 pointer-events-none" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">IOHealth AI Assistant</h2>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-10">
                Ask anything about your healthcare data — patient insights,
                clinical trends, and reports at your fingertips.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {[
                  {
                    text: "Show me the patient gender distribution",
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    ),
                  },
                  {
                    text: "What are the top diagnoses this month?",
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    ),
                  },
                  {
                    text: "How many patients visited last week?",
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                  },
                  {
                    text: "How many outpatients are in the system?",
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                  },
                ].map(({ text, icon }, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(text)}
                    className="group flex items-start gap-3 p-4 text-left bg-white/80 border border-gray-200/80 rounded-xl hover:border-primary/30 hover:bg-white hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary/12 transition-colors">
                      {icon}
                    </span>
                    <span className="text-sm text-gray-500 group-hover:text-gray-800 leading-relaxed transition-colors pt-0.5">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 mb-5">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 px-4 py-3">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-4 shadow-[0_-6px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelRecording}
                className="flex-shrink-0 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-150"
                aria-label="Cancel recording"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200/80 rounded-2xl">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-sm text-red-600 font-medium">Recording</span>
                <span className="text-sm text-red-400 font-mono">{formatDuration(recordingDuration)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="flex-shrink-0 p-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 transition-all duration-150"
                aria-label="Send voice message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-end bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/5 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your healthcare data..."
                className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none leading-relaxed"
                rows={1}
                disabled={isLoading || isLoadingHistory}
              />
              <div className="flex-shrink-0 p-2">
                {input.trim() ? (
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || isLoadingHistory}
                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={isLoading || isLoadingHistory}
                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                    aria-label="Record voice message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-4-12a3 3 0 00-3 3v4a3 3 0 006 0V8a3 3 0 00-3-3z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400 text-center">
            {isRecording ? "Click send to submit, or X to cancel" : "Enter to send · Shift+Enter for new line"}
          </p>
        </div>
      </div>
    </div>
  );
}
