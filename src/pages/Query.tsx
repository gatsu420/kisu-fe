import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { fetchAnswer } from "../lib/api";
import Header from "../components/Header";
import styles from "./Query.module.css";

interface Message {
  prompt: string;
  result?: unknown;
  error?: string;
}

export default function Query() {
  const [param, setParam] = useState("");
  const [paramDraft, setParamDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [filterDraft, setFilterDraft] = useState("");
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const paramLocked = param.length > 0 && filter.length > 0;

  useEffect(() => {
    if (paramLocked) promptRef.current?.focus();
  }, [paramLocked]);

  const handleSetParam = (e: FormEvent) => {
    e.preventDefault();
    const trimmedParam = paramDraft.trim();
    const trimmedFilter = filterDraft.trim();
    if (trimmedParam && trimmedFilter) {
      setParam(trimmedParam);
      setFilter(trimmedFilter);
    }
  };

  const handleAsk = async () => {
    if (!prompt.trim() || !paramLocked || loading) return;
    const currentPrompt = prompt.trim();
    setLoading(true);

    // Set placeholder message (overwrites previous)
    setMessage({ prompt: currentPrompt });

    try {
      const data = await fetchAnswer(currentPrompt, param, filter);
      setMessage({ prompt: currentPrompt, result: data });
    } catch (e) {
      if (e instanceof Error && e.message === "unauthorized") {
        navigate("/login");
        return;
      }
      const errMsg = e instanceof Error ? e.message : "something went wrong";
      setMessage({ prompt: currentPrompt, error: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handlePromptKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Query</h2>
          {/* Param setup */}
          {!paramLocked ? (
            <form onSubmit={handleSetParam} className={styles.setupCard}>
            <p className={styles.setupLabel}>Find these records ...</p>
            <div className={styles.setupRow}>
              <textarea
                className={styles.setupInputTextarea}
                placeholder="e.g. alice@example.com"
                value={paramDraft}
                onChange={(e) => setParamDraft(e.target.value)}
                rows={3}
                autoFocus
              />
              <p
                className={styles.setupLabel}
              >
                ... on this column
              </p>
              <input
                className={styles.setupInput}
                placeholder="e.g. email"
                value={filterDraft}
                onChange={(e) => setFilterDraft(e.target.value)}
              />
              <button
                type="submit"
                className={styles.setupBtn}
                style={{
                  opacity: paramDraft.trim() && filterDraft.trim() ? 1 : 0.5,
                }}
                disabled={!paramDraft.trim() || !filterDraft.trim()}
              >
                Set
              </button>
            </div>
          </form>
          ) : (
            <>
            {/* Info cards */}
            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <p className={styles.infoCardLabel}>Find these records:</p>
                  <button
                    className={styles.infoCardAction}
                    onClick={() => {
                      setParam("");
                      setParamDraft("");
                      setFilter("");
                      setFilterDraft("");
                      setMessage(null);
                    }}
                  >
                    change
                  </button>
                </div>
                <p className={styles.infoCardValue}>{param}</p>
              </div>
              <div className={styles.infoCard}>
                <p className={styles.infoCardLabel}>on this column:</p>
                <p className={styles.infoCardValue}>{filter}</p>
              </div>
            </div>

            {/* Input bar */}
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
                {loading ? "..." : "Ask"}
              </button>
            </div>

            {/* Result table */}
            <div className={styles.tableContainer}>
              {message === null ? (
                <p className={styles.emptyTable}>
                  Ask a question above to see results.
                </p>
              ) : message.error ? (
                <p className={styles.error}>{message.error}</p>
              ) : message.result !== undefined ? (
                <ResultTable data={message.result} />
              ) : (
                <p className={styles.thinking}>Thinking...</p>
              )}
            </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

interface ResultTableProps {
  data: unknown;
}

function ResultTable({ data }: ResultTableProps) {
  const rows = unwrapAnswer(data);

  if (rows && rows.length === 0) {
    return <p className={styles.emptyResult}>No results found.</p>;
  }

  if (
    rows &&
    rows.length > 0 &&
    typeof rows[0] === "object" &&
    rows[0] !== null
  ) {
    const columns = Object.keys(rows[0]);
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
    );
  }

  const textAnswer = getTextAnswer(data);
  if (textAnswer !== null) {
    return <p className={styles.emptyResult}>{textAnswer}</p>;
  }

  return <pre className={styles.pre}>{JSON.stringify(data, null, 2)}</pre>;
}

function unwrapAnswer(data: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if ("answer" in obj && Array.isArray(obj.answer)) {
      return obj.answer as Record<string, unknown>[];
    }
  }
  return null;
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getTextAnswer(data: unknown): string | null {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if ("answer" in obj && typeof obj.answer === "string") {
      return obj.answer as string;
    }
  }
  return null;
}
