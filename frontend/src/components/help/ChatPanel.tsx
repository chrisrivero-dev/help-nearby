'use client';

import type { FC, FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';
import { NeoPanel } from './NeoPanel';
import { PanelHeader } from './PanelHeader';
import { OllamaMessage } from '@/app/api/ollama/route';

// Chat message interface
interface ChatMessage extends OllamaMessage {
  id: string;
  timestamp: number;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch('/api/ollama');
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
  }, []);

  // Refresh models manually
  const refreshModels = useCallback(async () => {
    setIsRefreshingModels(true);
    setError(null);
    try {
      const res = await fetch('/api/ollama');
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
  }, [selectedModel]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedModel || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsChatLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...messages,
            { role: 'user', content: userMessage.content },
          ],
          stream: false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Failed to get response from Ollama');
        return;
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message?.content || '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(
        'Ollama not available. Please ensure Ollama is running on localhost:11434',
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  // Reset the conversation so the next message starts a fresh context.
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#7a7a7a' : '#888';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const inputBg = isDark ? '#0a0a0a' : '#fafafa';
  const inputBorder = isDark ? '#252525' : '#e4e4e4';
  const highlightColor = isDark ? '#fbbf24' : '#fbbf24';
  // Strong NeoPanel-style border for the header's vertical separator, matching
  // the NewsTicker's left-cell divider.
  const headerBorder = isDark ? '#404040' : '#111111';

  return (
    <NeoPanel
      className={className}
      fill={fill && isExpanded}
      isExpanded={isExpanded}
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
        </div>
        {/* Right cell — bordered off from the title, holds controls + chevron */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0 0.9rem',
            borderLeft: `1px solid ${headerBorder}`,
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                refreshModels();
              }}
              disabled={
                isModelLoading || isRefreshingModels || models.length === 0
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                padding: 0,
                border: `2px solid ${isDark ? '#fbbf24' : '#fbbf24'}`,
                background: isDark ? inputBg : '#f9f9f9',
                borderRadius: 4,
                cursor: models.length === 0 ? 'not-allowed' : 'pointer',
                opacity: models.length === 0 ? 0.5 : 1,
                transition: 'background-color 0.2s ease',
              }}
              title="Refresh models"
            >
              {isRefreshingModels ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 12, height: 12 }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isDark ? '#fbbf24' : '#fbbf24'}
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </motion.div>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isDark ? '#fbbf24' : '#fbbf24'}
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
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
                border: `2px solid ${isDark ? '#fbbf24' : '#fbbf24'}`,
                background: isDark ? inputBg : '#f9f9f9',
                borderRadius: 4,
                cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                opacity: messages.length === 0 ? 0.5 : 1,
                transition: 'background-color 0.2s ease',
              }}
              title="Clear chat"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isDark ? '#fbbf24' : '#fbbf24'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
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

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: fill ? '100%' : 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              flex: fill ? '1 1 auto' : undefined,
              minHeight: fill ? 0 : undefined,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: fill ? '1 1 auto' : undefined,
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

              {/* Chat history - scrollable area. In fill mode minHeight drops to 0
                so this region can shrink and keep the input pinned; otherwise a
                200px floor preserves the natural standalone/mobile look. */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1rem 1.4rem',
                  minHeight: fill ? 0 : '200px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${isDark ? mutedText : '#d1d5db'} transparent`,
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
                                msg.role === 'user'
                                  ? highlightColor
                                  : mutedText,
                            }}
                          >
                            {msg.role === 'user' ? 'You' : 'AI Assistant'}
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
                          }}
                        >
                          {msg.content}
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
                  borderTop: `2px solid ${divider}`,
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
                        border: `2px solid ${isDark ? '#fbbf24' : '#fbbf24'}`,
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
                  {isChatLoading && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        marginTop: '0.4rem',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.62rem',
                        color: mutedText,
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
                    </div>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NeoPanel>
  );
};
