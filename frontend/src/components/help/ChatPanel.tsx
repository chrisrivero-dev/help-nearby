'use client';

import type { FC, FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';
import { NeoPanel } from './NeoPanel';
import { PanelHeader } from './PanelHeader';
import { OllamaMessage } from '@/app/api/ollama/route';
import { useLocationContext } from './LocationContext';
import { useDetail, useGrounding } from './DashboardContext';
import type { DetailDescriptor } from './DashboardContext';
import {
  buildGroundingSystemPrompt,
  summarizeGrounding,
} from '@/lib/chat/buildGroundingPrompt';
import { ChatMarkdown } from './ChatMarkdown';
import { useOllamaEndpoint } from '@/contexts/OllamaEndpointContext';
import { Settings } from 'lucide-react';
import { PanelRefreshButton } from './PanelStatusControls';

// Chat message interface
interface ChatMessage extends OllamaMessage {
  id: string;
  timestamp: number;
  /** Locally-generated (e.g. grounding check) — shown in the UI but not sent to
   *  the model as conversation history. */
  local?: boolean;
}

// Model info interface
interface ModelInfo {
  name: string;
  digest: string;
  size: number;
  modified_at: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

// ChatPanel props
interface ChatPanelProps {
  className?: string;
  /** Controlled expand/collapse state (owned by the page so it can size the
   *  surrounding column). */
  isExpanded: boolean;
  onToggle: () => void;
  /** When true the panel fills its column (desktop). Mobile passes false so it
   *  keeps its natural, scroll-with-the-page height. */
  fill?: boolean;
}

// Helper to format file size
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const ChatPanel: FC<ChatPanelProps> = ({
  className,
  isExpanded,
  onToggle,
  fill = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocationContext();
  const { detail, openDetail } = useDetail();
  const { panelGrounding } = useGrounding();
  const { endpoint: ollamaEndpoint, setEndpoint } = useOllamaEndpoint();
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Models state
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Endpoint settings modal state
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [tempEndpoint, setTempEndpoint] = useState(ollamaEndpoint);

  // Sync temp endpoint when modal opens
  useEffect(() => {
    if (isEndpointModalOpen) {
      setTempEndpoint(ollamaEndpoint);
    }
  }, [isEndpointModalOpen, ollamaEndpoint]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Whether the view is pinned to the bottom. While true, new content
  // auto-scrolls; once the user scrolls up (e.g. to read mid-stream) it goes
  // false so streaming tokens don't yank them back down.
  const pinnedToBottomRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Map every openable item (across all panels) by id, so `[[open:<id>]]`
  // markers in assistant replies resolve back to a real detail descriptor.
  const descriptorsById = useMemo(() => {
    const map = new Map<string, DetailDescriptor>();
    for (const panel of Object.values(panelGrounding)) {
      for (const item of panel.items) {
        // Grounding-only items carry no descriptor — skip them so they never
        // produce a broken (unopenable) chip.
        if (item.descriptor) map.set(item.descriptor.id, item.descriptor);
      }
    }
    return map;
  }, [panelGrounding]);

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch('/api/ollama', {
          headers: { 'x-ollama-endpoint': ollamaEndpoint },
        });
        if (res.ok) {
          const data = await res.json();
          const modelList = data.models || [];
          setModels(modelList);
          if (modelList.length > 0) {
            setSelectedModel(modelList[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load Ollama models');
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModels();
  }, [ollamaEndpoint]);

  // Refresh models manually
  const refreshModels = useCallback(async () => {
    setIsRefreshingModels(true);
    setError(null);
    try {
      const res = await fetch('/api/ollama', {
        headers: { 'x-ollama-endpoint': ollamaEndpoint },
      });
      if (res.ok) {
        const data = await res.json();
        const modelList = data.models || [];
        setModels(modelList);
        if (
          modelList.length > 0 &&
          !modelList.some((m: ModelInfo) => m.name === selectedModel)
        ) {
          setSelectedModel(modelList[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to refresh models:', err);
      setError('Failed to refresh Ollama models');
    } finally {
      setIsRefreshingModels(false);
      setIsModelLoading(false);
    }
  }, [selectedModel, ollamaEndpoint]);

  // Track whether the user is parked at the bottom. A small threshold absorbs
  // sub-pixel rounding and the in-flight growth of a streaming message.
  const handleMessagesScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedToBottomRef.current = distanceFromBottom < 48;
  }, []);

  // Auto-scroll to the latest content only while pinned to the bottom, so a user
  // who scrolls up mid-stream isn't dragged back down on every token.
  useEffect(() => {
    if (!pinnedToBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Core send path for the input form.
  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !selectedModel || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    // Sending re-anchors to the bottom even if the user had scrolled up.
    pinnedToBottomRef.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setIsChatLoading(true);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Ground the model in the current page context (location → open detail →
    // panel lists). Rebuilt per send so it always reflects the latest state, and
    // kept out of the visible `messages` history.
    const systemPrompt = buildGroundingSystemPrompt({
      location,
      detail,
      panelGrounding,
    });

    try {
      const res = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ollama-endpoint': ollamaEndpoint,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...(systemPrompt
              ? [{ role: 'system' as const, content: systemPrompt }]
              : []),
            ...messages
              .filter((m) => !m.local)
              .map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: trimmed },
          ],
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Failed to get response from Ollama');
        return;
      }

      // Add an empty assistant message up front, then fill it in live as the
      // NDJSON stream arrives so the user sees the reply build token by token.
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      // Ollama streams one JSON object per line: { message: { content }, done }.
      // Content arrives as deltas, so we accumulate and re-render on each token.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          let chunk: {
            message?: { content?: string };
            done?: boolean;
            error?: string;
          };
          try {
            chunk = JSON.parse(trimmedLine);
          } catch {
            continue;
          }
          if (chunk.error) {
            setError(chunk.error);
            continue;
          }
          if (chunk.message?.content) {
            content += chunk.message.content;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content } : m)),
            );
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      if (err instanceof Error && (err as Error).name === 'AbortError') {
        console.log('Chat request was aborted by user');
        setError(null);
        return;
      }
      setError(
        'Ollama not available. Please ensure Ollama is running on localhost:11434',
      );
    } finally {
      setIsChatLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const content = inputMessage.trim();
    if (!content) return;
    setInputMessage('');
    void sendMessage(content);
  };

  // Verify grounding deterministically — no model round-trip. Appends a local
  // readout of the location + active panels the chat is currently grounded in,
  // so grounding can be confirmed instantly without taxing a small model.
  const verifyGrounding = useCallback(() => {
    const digest = summarizeGrounding({ location, detail, panelGrounding });
    setMessages((prev) => [
      ...prev,
      {
        id: `verify-${Date.now()}`,
        role: 'assistant',
        content: digest,
        timestamp: Date.now(),
        local: true,
      },
    ]);
  }, [location, detail, panelGrounding]);

  // Stop the current LLM request
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsChatLoading(false);
    }
  }, []);

  // Reset the conversation so the next message starts a fresh context.
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cardText = isDark ? '#f4f4f4' : '#111111';
  const mutedText = isDark ? '#b8b8b8' : '#888';
  const divider = isDark ? '#2a2a2a' : '#f0f0f0';
  const border = isDark ? '#3A3A3A' : '#111111';
  const inputBg = isDark ? '#080808' : '#fafafa';
  const inputBorder = isDark ? '#3A3A3A' : '#d0d0d0';
  const highlightColor = '#E0A800';
  // Strong NeoPanel-style border for the header's vertical separator, matching
  // the NewsTicker's left-cell divider.
  const headerBorder = isDark ? '#404040' : '#111111';

  return (
    <NeoPanel
      className={className}
      fill={fill && isExpanded}
      isExpanded={isExpanded}
      style={{
        borderTop: `2px solid ${border}`,
        borderLeft: `2px solid ${border}`,
        borderRight: `2px solid ${border}`,
        borderBottom: 'none',
      }}
    >
      {/* Header — compact, NewsTicker-height. Title sits in a left cell; the
          model selector + action buttons + chevron live in a right cell fenced
          off by a full-height vertical border. */}
      <PanelHeader divider={divider} isDark={isDark} dense onClick={onToggle}>
        {/* Title cell (owns its own horizontal padding in dense mode) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0 1.4rem',
          }}
        >
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              color: cardText,
            }}
          >
            CHAT! NEARBY
          </span>
          {/* Verify grounding button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              verifyGrounding();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              background: 'transparent',
              borderRadius: 4,
              cursor: 'pointer',
              color: mutedText,
            }}
            title="Verify grounding — show the location and panels the chat can see"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4" />
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
          </button>
          {/* Clear chat — resets the conversation to start fresh context */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearChat();
            }}
            disabled={messages.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              background: 'transparent',
              borderRadius: 4,
              cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
              color: mutedText,
              opacity: messages.length === 0 ? 0.5 : 1,
            }}
            title="Clear chat"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
        {/* Right cell — bordered off from the title, holds remaining controls + chevron */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0 0.9rem',
            borderLeft: `1px solid ${divider}`,
          }}
        >
          {/* Interactive controls cluster — transparent so it blends with the
              header (and its amber hover); each control carries its own stable
              surface so its text/icon stays legible. Stops click/mousedown
              propagation so using these never toggles the panel's collapse. */}
          <div
            className="help-panel-header-controls"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'transparent',
              cursor: 'default',
            }}
          >
            {/* Model selector in header */}
            <div
              style={{
                position: 'relative',
                backgroundColor: isDark ? inputBg : '#f9f9f9',
                borderRadius: 4,
                transition: 'background-color 0.2s ease',
              }}
            >
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={
                  isModelLoading || isRefreshingModels || models.length === 0
                }
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: cardText,
                  background: 'transparent',
                  border: `2px solid ${inputBorder}`,
                  padding: '0.4rem 0.6rem 0.4rem 0.8rem',
                  borderRadius: 4,
                  cursor: models.length === 0 ? 'not-allowed' : 'pointer',
                  outline: 'none',
                  appearance: 'none',
                }}
              >
                {isModelLoading || isRefreshingModels ? (
                  <option>Loading...</option>
                ) : models.length === 0 ? (
                  <option>No models found</option>
                ) : (
                  models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({formatSize(model.size)})
                    </option>
                  ))
                )}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: mutedText,
                }}
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9L12 15L18 9" />
                </svg>
              </div>
            </div>
            {/* Refresh button */}
            <PanelRefreshButton
              loading={isRefreshingModels}
              onRefresh={refreshModels}
              isDark={isDark}
              label="Refresh models"
            />
            {/* Endpoint settings — gear icon to configure Ollama endpoint */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEndpointModalOpen((prev) => !prev);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                padding: 0,
                border: 'none',
                background: 'transparent',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                opacity: 0.7,
              }}
              title="Configure Ollama endpoint"
            >
              <Settings size={13} color={mutedText} />
            </button>
          </div>
          <motion.div
            style={{
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: mutedText,
            }}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9L12 15L18 9" />
            </svg>
          </motion.div>
        </div>
      </PanelHeader>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          <div
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {/* Error message */}
            {error && (
              <div
                style={{
                  padding: '0.9rem 1.4rem',
                  borderBottom: `1px solid ${isDark ? '#b91c1c' : '#ef4444'}`,
                  background: isDark ? '#7f1d1d' : '#fee2e2',
                  color: isDark ? '#fca5a5' : '#991b1b',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {error}
              </div>
            )}

            {/* Thinking status - above the input row */}
            {isChatLoading && (
              <div
                style={{
                  padding: '0.6rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.68rem',
                  color: mutedText,
                  borderTop: `1px solid ${divider}`,
                  borderBottom: `1px solid ${divider}`,
                  background: inputBg,
                }}
              >
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: mutedText,
                  }}
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.2,
                  }}
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: mutedText,
                  }}
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.4,
                  }}
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: mutedText,
                  }}
                />
                <span>Thinking...</span>
                <button
                  type="button"
                  onClick={handleStop}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 'auto',
                    width: 18,
                    height: 18,
                    padding: 0,
                    border: `2px solid ${isDark ? '#ef4444' : '#dc2626'}`,
                    background: isDark ? '#7f1d1d' : '#fee2e2',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '0.5rem',
                    fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                    color: isDark ? '#fca5a5' : '#b91c1c',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                  }}
                  title="Stop generating"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                </button>
              </div>
            )}

            {/* Chat history - scrollable area. In fill mode minHeight drops to 0
                so this region can shrink and keep the input pinned; otherwise a
                200px floor preserves the natural standalone/mobile look. */}
            <div
              ref={scrollContainerRef}
              onScroll={handleMessagesScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 1.4rem',
                minHeight: fill ? 0 : '200px',
                scrollbarWidth: 'thin',
                scrollbarColor: `${isDark ? mutedText : '#d1d5db'} transparent`,
                position: 'relative',
              }}
            >
              {messages.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: '200px',
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    color: mutedText,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      marginBottom: '0.8rem',
                    }}
                  >
                    Type a message below to start a conversation
                  </div>
                  <button
                    type="button"
                    onClick={verifyGrounding}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#E0A800',
                      background: 'transparent',
                      border: `1px solid ${'#E0A800'}`,
                      borderRadius: 4,
                      padding: '0.4rem 0.7rem',
                      cursor: 'pointer',
                    }}
                    title="Show the location and panels the chat can see"
                  >
                    Verify context
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color:
                              msg.role === 'user' ? highlightColor : mutedText,
                          }}
                        >
                          {msg.local
                            ? 'Grounding'
                            : msg.role === 'user'
                              ? 'You'
                              : 'AI Assistant'}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.54rem',
                            color: mutedText,
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.74rem',
                          lineHeight: 1.6,
                          color: cardText,
                          padding: '0.8rem 1rem',
                          background:
                            msg.role === 'user'
                              ? inputBg
                              : isDark
                                ? '#1a1a1a'
                                : '#f9f9f9',
                          border: `1px solid ${msg.role === 'user' ? inputBorder : divider}`,
                          borderRadius: 4,
                          // Markdown owns its own block spacing; plain-text
                          // messages (user input, grounding digest) keep newlines.
                          whiteSpace:
                            msg.role === 'assistant' && !msg.local
                              ? 'normal'
                              : 'pre-wrap',
                        }}
                      >
                        {msg.role === 'assistant' && !msg.local ? (
                          <ChatMarkdown
                            content={msg.content}
                            isDark={isDark}
                            descriptorsById={descriptorsById}
                            onOpen={openDetail}
                          />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input cell - anchored in-flow at the bottom of the panel while
                the messages area above scrolls. */}
            <div
              style={{
                flexShrink: 0,
                padding: '0.75rem 1rem',
                borderTop: `2px solid ${border}`,
                background: inputBg,
              }}
            >
              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      models.length === 0
                        ? 'No Ollama models available'
                        : 'Type your message...'
                    }
                    disabled={isChatLoading || models.length === 0}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.74rem',
                      color: cardText,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      padding: '0.3rem 0',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={
                      !inputMessage.trim() ||
                      isChatLoading ||
                      models.length === 0
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      padding: 0,
                      border: `2px solid #E0A800`,
                      background:
                        isChatLoading || models.length === 0
                          ? mutedText
                          : highlightColor,
                      borderRadius: 0,
                      cursor:
                        !inputMessage.trim() ||
                        isChatLoading ||
                        models.length === 0
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        !inputMessage.trim() ||
                        isChatLoading ||
                        models.length === 0
                          ? 0.5
                          : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isDark ? '#000' : '#fff'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
              </form>
            </div>
            {/* Endpoint settings modal */}
            {isEndpointModalOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  minWidth: 300,
                  padding: '1.5rem',
                  background: isDark ? '#0a0a0a' : '#ffffff',
                  border: `1px solid ${border}`,
                  borderRadius: 0,
                  boxShadow: isDark
                    ? '0 8px 24px rgba(0,0,0,0.8)'
                    : '0 8px 24px rgba(0,0,0,0.12)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: cardText,
                    }}
                  >
                    Ollama Endpoint
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEndpointModalOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      padding: 0,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: mutedText,
                    }}
                    aria-label="Close settings"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6L18 18" />
                    </svg>
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                      fontSize: '0.64rem',
                      color: mutedText,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      API Endpoint URL
                    </span>
                    <input
                      type="text"
                      value={tempEndpoint}
                      onChange={(e) => setTempEndpoint(e.target.value)}
                      placeholder="http://localhost:11434"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.7rem',
                        color: cardText,
                        background: isDark ? '#000' : '#fafafa',
                        border: `1px solid ${isDark ? '#252525' : '#e4e4e4'}`,
                        borderRadius: 4,
                        padding: '0.5rem 0.7rem',
                        outline: 'none',
                      }}
                    />
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsEndpointModalOpen(false);
                        setTempEndpoint(ollamaEndpoint);
                      }}
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '0.4rem 0.8rem',
                        background: 'transparent',
                        border: `1px solid ${isDark ? '#333' : '#d1d5db'}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: mutedText,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = tempEndpoint.trim();
                        if (trimmed) {
                          setEndpoint(trimmed);
                        }
                        // Reset models when endpoint changes
                        setModels([]);
                        setSelectedModel('');
                        setIsEndpointModalOpen(false);
                      }}
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '0.4rem 0.8rem',
                        background: '#E0A800',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: isDark ? '#000' : '#fff',
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </NeoPanel>
  );
};
