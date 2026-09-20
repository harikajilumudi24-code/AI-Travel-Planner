import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Send, Plus, MessageSquare, Trash2, Edit2, Check, X,
  User, MapPin, Cloud, UtensilsCrossed, Navigation, Calendar, AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { classNames } from '@/utils/format';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const examplePrompts = [
  'Plan a 5 day trip to Goa for 2 people',
  'Find restaurants near Baga Beach',
  'What will the weather be tomorrow in Paris?',
  'What places can I visit near my hotel in Tokyo?',
  'Give me a budget-friendly itinerary for Bali',
];

export default function Assistant() {
  const { user } = useAuth();
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setLoadingConvos(true);
    try {
      const data = await api.listConversations();
      setConversations(data);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
    } catch { /* ignore */ }
    finally { setLoadingConvos(false); }
  }, [activeId]);

  useEffect(() => { loadConversations(); }, []);

  const loadMessages = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await api.getConversation(id);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    const currentInput = input;
    setInput('');
    setSending(true);

    try {
      const res = await api.chat({
        message: currentInput,
        conversation_id: activeId,
      });
      if (res.conversation_id && !activeId) {
        setActiveId(res.conversation_id);
      }
      setMessages((m) => [...m, { role: 'assistant', content: res.response, sources: res.sources, intent: res.intent }]);
      loadConversations();
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}`, error: true }]);
    } finally { setSending(false); }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleRename = async (id) => {
    if (!renameValue.trim()) return;
    try {
      await api.renameConversation(id, renameValue.trim());
      setConversations((c) => c.map((conv) => conv.id === id ? { ...conv, title: renameValue.trim() } : conv));
      setRenaming(null);
      toast.success('Conversation renamed');
    } catch { toast.error('Failed to rename'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteConversation(deleteTarget);
      setConversations((c) => c.filter((conv) => conv.id !== deleteTarget));
      if (activeId === deleteTarget) { setActiveId(null); setMessages([]); }
      setDeleteTarget(null);
      toast.success('Conversation deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className={classNames(
        'fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform lg:translate-x-0 pt-16 lg:pt-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <Button fullWidth onClick={handleNewChat} leftIcon={<Plus className="w-4 h-4" />}>New Chat</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvos ? (
            <LoadingSpinner className="py-8" />
          ) : conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={classNames(
                  'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition',
                  activeId === conv.id ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
                )}
                onClick={() => { setActiveId(conv.id); setSidebarOpen(false); }}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                {renaming === conv.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(conv.id)}
                    onBlur={() => setRenaming(null)}
                    className="flex-1 bg-transparent border-b border-primary-400 outline-none text-sm"
                  />
                ) : (
                  <span className="flex-1 text-sm truncate">{conv.title}</span>
                )}
                <div className="hidden group-hover:flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setRenaming(conv.id); setRenameValue(conv.title); }} className="p-1 hover:text-primary-600">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv.id); }} className="p-1 hover:text-error-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm">AI Travel Assistant</h1>
            <p className="text-xs text-gray-400">Powered by Groq Llama 3.3 + RAG with real data</p>
          </div>
          <Badge variant="success" size="xs" dot>Online</Badge>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4 animate-float">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-extrabold mb-2">Where shall we go?</h2>
              <p className="text-gray-500 text-sm text-center max-w-md mb-8">Ask me anything about travel — trip planning, places, restaurants, weather, or directions. I use real data to answer.</p>
              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {examplePrompts.map((prompt) => (
                  <Card key={prompt} hover className="p-4 cursor-pointer" onClick={() => { setInput(prompt); }}>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{prompt}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-4 space-y-6 py-6">
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} userName={user?.name} />
              ))}
              {sending && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 dark:border-gray-800">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about trips, places, restaurants, weather…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 max-h-32"
              style={{ minHeight: '48px' }}
            />
            <Button onClick={handleSend} loading={sending} className="shrink-0" aria-label="Send">
              {!sending && <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">AI may retrieve real data from Geoapify, OpenWeather, and Tavily. Always verify critical details.</p>
        </div>
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete conversation?" size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Delete</Button>
          </div>
        }
      >
        <p className="text-sm text-gray-500">This will permanently delete the conversation and all its messages. This cannot be undone.</p>
      </Modal>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={classNames('flex gap-3 animate-fade-in-up', isUser && 'flex-row-reverse')}>
      <div className={classNames(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        isUser ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gradient-to-br from-primary-500 to-accent-500',
      )}>
        {isUser ? <User className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>
      <div className={classNames('max-w-[85%] sm:max-w-[80%]', isUser && 'items-end')}>
        <div className={classNames(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary-600 text-white rounded-tr-sm whitespace-pre-wrap'
            : msg.error
              ? 'bg-error-50 dark:bg-error-950/30 text-error-600 rounded-tl-sm border border-error-200 dark:border-error-800'
              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-gray-800',
        )}>
          {isUser ? (
            msg.content
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="font-display text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-4 first:mt-0 mb-3">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-display text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-4 first:mt-0 mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-display text-base font-semibold text-gray-900 dark:text-gray-100 mt-3 first:mt-0 mb-1.5">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 last:mb-0">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-gray-100">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-800 dark:text-gray-200">
                    {children}
                  </em>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 my-2.5 space-y-1 text-gray-700 dark:text-gray-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 my-2.5 space-y-1 text-gray-700 dark:text-gray-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">
                    {children}
                  </li>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white/50 dark:bg-gray-900/50">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 sm:px-4 sm:py-2.5 font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 sm:px-4 sm:py-2.5 text-gray-700 dark:text-gray-300">
                    {children}
                  </td>
                ),
                hr: () => (
                  <hr className="my-4 border-t border-gray-200 dark:border-gray-800" />
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-950 text-gray-100 p-3 rounded-xl overflow-x-auto text-xs font-mono my-3 border border-gray-800">
                    {children}
                  </pre>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.sources.map((src, i) => (
              <Badge key={i} variant="default" size="xs">Source: {src}</Badge>
            ))}
          </div>
        )}
        {!isUser && msg.intent && (
          <div className="mt-2 text-xs text-gray-400">
            <span className="font-semibold">Intent:</span> {msg.intent.query_type || 'general'}
            {msg.intent.destination && ` · ${msg.intent.destination}`}
          </div>
        )}
      </div>
    </div>
  );
}
