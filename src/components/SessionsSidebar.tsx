"use client";

import { useState, useEffect } from "react";
import { Session, SessionsListResponse } from "@/types/chat";

interface SessionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

export default function SessionsSidebar({
  isOpen,
  onClose,
  onSelectSession,
  onDeleteSession,
  currentSessionId,
}: SessionsSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions");
      const data: SessionsListResponse = await response.json();
      if (data.status === "success" && data.data?.sessions) {
        setSessions(data.data.sessions);
      } else {
        setError(data.message || "Failed to load sessions");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    setDeletingId(sessionId);
    try {
      const response = await fetch(`/api/sessions?id=${sessionId}&delete=true`);
      const data = await response.json();
      if (data.status === "success") {
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        if (currentSessionId === sessionId) {
          onDeleteSession(sessionId);
        }
      } else {
        alert("Failed to delete session");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen]);

  const formatSessionId = (sessionId: string) => {
    return "Chat " + sessionId.replace("session_", "").substring(0, 8).toUpperCase();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl shadow-black/10 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Chat History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sessions count badge */}
        {!isLoading && !error && sessions.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <span className="text-xs text-gray-400 font-medium">
              {sessions.length} conversation{sessions.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading sessions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <button onClick={fetchSessions} className="text-xs text-primary hover:underline font-medium">
                Try again
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-medium">No conversations yet</p>
              <p className="text-gray-400 text-xs mt-1">Start chatting to see history here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => {
                const isActive = currentSessionId === session.session_id;
                return (
                  <div
                    key={session.session_id}
                    className={`group flex items-center rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-primary shadow-sm shadow-primary/15"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectSession(session.session_id);
                        onClose();
                      }}
                      className="flex-1 text-left px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-gray-200"
                        } transition-colors`}>
                          <svg className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                        <span className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-gray-700"}`}>
                          {formatSessionId(session.session_id)}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => deleteSession(session.session_id, e)}
                      disabled={deletingId === session.session_id}
                      className={`flex-shrink-0 p-1.5 mr-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                        isActive
                          ? "text-white/60 hover:text-white hover:bg-white/20"
                          : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      } ${deletingId === session.session_id ? "opacity-50" : ""}`}
                      aria-label="Delete session"
                    >
                      {deletingId === session.session_id ? (
                        <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={fetchSessions}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </>
  );
}
