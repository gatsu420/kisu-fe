import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAnswer } from '../lib/api'
import styles from './Dashboard.module.css'

interface Message {
  prompt: string
  result?: unknown
  error?: string
}

export default function Dashboard() {
  const [param, setParam] = useState('')
  const [paramDraft, setParamDraft] = useState('')
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedCalls, setExpandedCalls] = useState<Record<number, boolean>>({})
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const paramLocked = param.length > 0

  useEffect(() => {
    if (paramLocked) promptRef.current?.focus()
  }, [paramLocked])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSetParam = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = paramDraft.trim()
    if (trimmed) setParam(trimmed)
  }

  const handleAsk = async () => {
    if (!prompt.trim() || !paramLocked || loading) return
    const currentPrompt = prompt.trim()
    setPrompt('')
    setLoading(true)

    // Append a placeholder message
    const idx = messages.length
    setMessages((prev) => [...prev, { prompt: currentPrompt }])

    try {
      const data = await fetchAnswer(currentPrompt, param)
      setMessages((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, result: data } : m)),
      )
    } catch (e) {
      if (e instanceof Error && e.message === 'unauthorized') {
        navigate('/login')
        return
      }
      const errMsg = e instanceof Error ? e.message : 'something went wrong'
      setMessages((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, error: errMsg } : m)),
      )
    } finally {
      setLoading(false)
    }
  }

  const handlePromptKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo}>kisu</h1>
        <button
          className={styles.signOutBtn}
          onClick={() => navigate('/login?signout')}
        >
          Sign out
        </button>
      </header>

      <main className={styles.main}>
        {/* Param setup */}
        {!paramLocked ? (
          <form onSubmit={handleSetParam} className={styles.setupCard}>
            <p className={styles.setupLabel}>Who or what do you want to look up?</p>
            <div className={styles.setupRow}>
              <input
                className={styles.setupInput}
                type="text"
                placeholder="e.g. alice@example.com"
                value={paramDraft}
                onChange={(e) => setParamDraft(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className={styles.setupBtn}
                style={{ opacity: paramDraft.trim() ? 1 : 0.5 }}
                disabled={!paramDraft.trim()}
              >
                Set
              </button>
            </div>
          </form>
        ) : (
          <>

            {/* Messages */}
            <div className={styles.messages}>
              {messages.map((msg, i) => {
                const funcCalls = getFuncCalls(msg.result)
                const expanded = !!expandedCalls[i]
                const toggleCalls = funcCalls
                  ? () =>
                      setExpandedCalls((prev) => ({
                        ...prev,
                        [i]: !prev[i],
                      }))
                  : undefined
                return (
                  <div key={i} className={styles.message}>
                    <div className={styles.promptRow}>
                      <p className={styles.promptLabel}>{msg.prompt}</p>
                      {toggleCalls && (
                        <button
                          className={styles.moreBtn}
                          onClick={toggleCalls}
                          title="Show details"
                        >
                          ⋯
                        </button>
                      )}
                    </div>
                    {msg.error ? (
                      <p className={styles.error}>{msg.error}</p>
                    ) : msg.result !== undefined ? (
                      <>
                        {funcCalls && expanded && (
                          <div className={styles.funcCallsBubble}>
                            <p className={styles.funcCallsTitle}>Function Call</p>
                            <pre className={styles.funcCallsPre}>{funcCalls}</pre>
                          </div>
                        )}
                        <ResultTable data={msg.result} />
                      </>
                    ) : (
                      <p className={styles.thinking}>Thinking...</p>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className={styles.chipRow}>
              <span className={styles.chipLabel}>Looking up:</span>
              <span className={styles.chip}>{param}</span>
              <button
                className={styles.chipChange}
                onClick={() => {
                  setParam('')
                  setParamDraft('')
                  setMessages([])
                }}
              >
                change
              </button>
            </div>
            <div className={styles.inputBar}>
              <textarea
                ref={promptRef}
                className={styles.promptInput}
                placeholder="What do you want to know?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handlePromptKey}
                rows={1}
              />
              <button
                className={styles.askBtn}
                style={{ opacity: loading || !prompt.trim() ? 0.5 : 1 }}
                onClick={handleAsk}
                disabled={loading || !prompt.trim()}
              >
                {loading ? '...' : 'Ask'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

interface ResultTableProps {
  data: unknown
}

function ResultTable({ data }: ResultTableProps) {
  const rows = unwrapAnswer(data)

  if (rows && rows.length === 0) {
    return <p className={styles.emptyResult}>No results found.</p>
  }

  if (
    rows &&
    rows.length > 0 &&
    typeof rows[0] === 'object' &&
    rows[0] !== null
  ) {
    const columns = Object.keys(rows[0])
    return (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className={styles.th}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? styles.trEven : undefined}>
                {columns.map((col) => (
                  <td key={col} className={styles.td}>
                    {renderCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const textAnswer = getTextAnswer(data)
  if (textAnswer !== null) {
    return <p className={styles.emptyResult}>{textAnswer}</p>
  }

  return <pre className={styles.pre}>{JSON.stringify(data, null, 2)}</pre>
}

function unwrapAnswer(data: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>
    if ('answer' in obj && Array.isArray(obj.answer)) {
      return obj.answer as Record<string, unknown>[]
    }
  }
  return null
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getFuncCalls(data: unknown): string | null {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>
    if (
      'stringified_func_calls' in obj &&
      typeof obj.stringified_func_calls === 'string' &&
      obj.stringified_func_calls !== 'null'
    ) {
      return obj.stringified_func_calls
    }
  }
  return null
}

function getTextAnswer(data: unknown): string | null {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>
    if ('answer' in obj && typeof obj.answer === 'string') {
      return obj.answer
    }
  }
  return null
}
