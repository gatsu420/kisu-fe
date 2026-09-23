import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTool, toolTypeOf, type Tool, type ToolType } from "../lib/api";
import Header from "../components/Header";
import styles from "./Tool.module.css";

export default function ListTool() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ToolType>("table");
  const [tool, setTool] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const changeMode = (next: ToolType) => {
    setMode(next);
  };

  const visibleTool = tool.filter((item) => toolTypeOf(item) === mode);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTool();
        if (active) setTool(data);
      } catch (e) {
        if (e instanceof Error && e.message === "unauthorized") {
          navigate("/login");
          return;
        }
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load tool");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>List Tools</h2>

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${
                mode === "table" ? styles.tabActive : ""
              }`}
              onClick={() => changeMode("table")}
            >
              By Table
            </button>
            <button
              type="button"
              className={`${styles.tab} ${
                mode === "query" ? styles.tabActive : ""
              }`}
              onClick={() => changeMode("query")}
            >
              By Query
            </button>
          </div>

          {loading && <p className={styles.emptyState}>Loading tool...</p>}

          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && visibleTool.length === 0 && (
            <p className={styles.emptyState}>
              No tool yet. Add one from the Add Tool page.
            </p>
          )}

          {!loading && !error && visibleTool.length > 0 && (
            <div className={styles.toolList}>
              {visibleTool.map((item, index) => (
                <ToolCard key={index} tool={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface ToolCardProps {
  tool: Tool;
}

function ToolCard({ tool }: ToolCardProps) {
  const title = tool.table_name || tool.tool_description || "(untitled tool)";
  const showDescription = Boolean(tool.table_name && tool.tool_description);

  return (
    <div className={styles.toolCard}>
      <div className={styles.toolHeader}>
        <div>
          <h3 className={styles.toolTable}>{title}</h3>
          {showDescription && (
            <p className={styles.toolDescription}>{tool.tool_description}</p>
          )}
        </div>
      </div>

      {(tool.param_name || tool.param_type) && (
        <div>
          <p className={styles.sectionTitle}>Parameter</p>
          <div className={styles.paramInfoRow}>
            <div>
              <p className={styles.paramLabel}>Name</p>
              <p className={styles.paramValue}>{tool.param_name || "—"}</p>
            </div>
            <div>
              <p className={styles.paramLabel}>Type</p>
              <p className={styles.paramValue}>{tool.param_type || "—"}</p>
            </div>
            {tool.param_description && (
              <div>
                <p className={styles.paramLabel}>Description</p>
                <p className={styles.paramValue}>{tool.param_description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tool.columns.length > 0 && (
        <div>
          <p className={styles.sectionTitle}>Columns</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Description</th>
                </tr>
              </thead>
              <tbody>
                {tool.columns.map((col, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? styles.trEven : undefined}
                  >
                    <td className={styles.td}>{col.name}</td>
                    <td className={styles.td}>{col.type}</td>
                    <td className={styles.td}>{col.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tool.examples.length > 0 && (
        <div>
          <p className={styles.sectionTitle}>Query</p>
          <div className={styles.exampleList}>
            {tool.examples.map((example, i) => (
              <div key={i} className={styles.example}>
                {example.description && (
                  <p className={styles.exampleDescription}>
                    {example.description}
                  </p>
                )}
                <pre className={styles.codeBlock}>{example.query}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
