import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { addTool, type ToolType } from "../lib/api";
import Header from "../components/Header";
import styles from "./Tool.module.css";

interface Column {
  name: string;
  type: string;
  description: string;
}

interface Query {
  description: string;
  query: string;
}

interface FormData {
  tool_description: string;
  table_name: string;
  columns: Column[];
  query: Query[];
  param_name: string;
  param_type: string;
  param_description: string;
}

export default function AddTool() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ToolType>("table");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeMode = (next: ToolType) => {
    setSuccess(false);
    setError(null);
    if (next === "query") {
      // Query mode allows only one query.
      setFormData((prev) => ({ ...prev, query: prev.query.slice(0, 1) }));
    }
    setMode(next);
  };

  const [formData, setFormData] = useState<FormData>({
    tool_description: "",
    table_name: "",
    columns: [{ name: "", type: "", description: "" }],
    query: [{ description: "", query: "" }],
    param_name: "",
    param_type: "",
    param_description: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof FormData,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleColumnChange = (
    index: number,
    field: keyof Column,
    value: string,
  ) => {
    const newColumns = [...formData.columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setFormData((prev) => ({ ...prev, columns: newColumns }));
  };

  const addColumn = () => {
    setFormData((prev) => ({
      ...prev,
      columns: [...prev.columns, { name: "", type: "", description: "" }],
    }));
  };

  const removeColumn = (index: number) => {
    if (formData.columns.length <= 1) return;
    const newColumns = formData.columns.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, columns: newColumns }));
  };

  const handleQueryChange = (
    index: number,
    field: keyof Query,
    value: string,
  ) => {
    const newQuery = [...formData.query];
    newQuery[index] = { ...newQuery[index], [field]: value };
    setFormData((prev) => ({ ...prev, query: newQuery }));
  };

  const addQuery = () => {
    setFormData((prev) => ({
      ...prev,
      query: [...prev.query, { description: "", query: "" }],
    }));
  };

  const removeQuery = (index: number) => {
    if (formData.query.length <= 1) return;
    const newQuery = formData.query.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, query: newQuery }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate
    const missingTableName =
      mode === "table" && !formData.table_name.trim();
    if (
      !formData.tool_description.trim() ||
      missingTableName ||
      !formData.param_name.trim() ||
      !formData.param_type.trim()
    ) {
      setError(
        mode === "table"
          ? "Please fill in all required fields"
          : "Please fill in the tool description and parameter fields",
      );
      return;
    }

    setLoading(true);
    try {
      await addTool({
        tool_description: formData.tool_description,
        table_name: mode === "table" ? formData.table_name : "",
        columns: formData.columns,
        type: mode,
        examples: formData.query,
        param_name: formData.param_name,
        param_type: formData.param_type,
        param_description: formData.param_description,
      });
      setSuccess(true);
      // Reset form
      setFormData({
        tool_description: "",
        table_name: "",
        columns: [{ name: "", type: "", description: "" }],
        query: [{ description: "", query: "" }],
        param_name: "",
        param_type: "",
        param_description: "",
      });
    } catch (e) {
      if (e instanceof Error && e.message === "unauthorized") {
        navigate("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to add tool");
    } finally {
      setLoading(false);
    }
  };

  const queryForm = (
    <div className={styles.formGroup}>
      <label className={styles.label}>Query</label>
      {mode === "query" && (
        <p className={styles.hint}>
          The query is the source of truth. It can involve a
          join. No table name is needed.
        </p>
      )}
      {formData.query.map((entry, index) => (
        <div key={index} className={styles.arrayRow}>
          <input
            className={styles.arrayInput}
            type="text"
            placeholder="Description"
            value={entry.description}
            onChange={(e) =>
              handleQueryChange(index, "description", e.target.value)
            }
          />
          <input
            className={styles.arrayInput}
            type="text"
            placeholder="SQL query"
            value={entry.query}
            onChange={(e) =>
              handleQueryChange(index, "query", e.target.value)
            }
          />
          {mode === "table" && formData.query.length > 1 && (
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removeQuery(index)}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {mode === "table" && (
        <button
          type="button"
          className={styles.addBtn}
          onClick={addQuery}
        >
          + Add Query
        </button>
      )}
    </div>
  );

  const columnsForm = (
    <div className={styles.formGroup}>
      <label className={styles.label}>Columns</label>
      {formData.columns.map((col, index) => (
        <div key={index} className={styles.arrayRow}>
          <input
            className={styles.arrayInput}
            type="text"
            placeholder="Name"
            value={col.name}
            onChange={(e) =>
              handleColumnChange(index, "name", e.target.value)
            }
          />
          <input
            className={styles.arrayInput}
            type="text"
            placeholder="Type (e.g. string, int)"
            value={col.type}
            onChange={(e) =>
              handleColumnChange(index, "type", e.target.value)
            }
          />
          <input
            className={styles.arrayInput}
            type="text"
            placeholder="Description"
            value={col.description}
            onChange={(e) =>
              handleColumnChange(index, "description", e.target.value)
            }
          />
          {formData.columns.length > 1 && (
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removeColumn(index)}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className={styles.addBtn}
        onClick={addColumn}
      >
        + Add Column
      </button>
    </div>
  );

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Add New Tool</h2>

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

          {success && (
            <div className={styles.success}>
              Tool added successfully! You can now use it in the Query.
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Tool Description */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Tool Description <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Describe what this tool does..."
                value={formData.tool_description}
                onChange={(e) => handleInputChange(e, "tool_description")}
                rows={3}
              />
            </div>

            {/* Table Name */}
            {mode === "table" && (
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Table Name <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. users"
                  value={formData.table_name}
                  onChange={(e) => handleInputChange(e, "table_name")}
                />
              </div>
            )}

            {/* Table tab: Columns first. Query tab: Query first. */}
            {mode === "table" ? columnsForm : queryForm}
            {mode === "table" ? queryForm : columnsForm}

            {/* Param Section */}
            <div className={styles.paramSection}>
              <h3 className={styles.paramTitle}>Parameter Configuration</h3>
              <div className={styles.paramRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Param Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. email"
                    value={formData.param_name}
                    onChange={(e) => handleInputChange(e, "param_name")}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Param Type <span className={styles.required}>*</span>
                  </label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. string"
                    value={formData.param_type}
                    onChange={(e) => handleInputChange(e, "param_type")}
                  />
                </div>
              </div>
              <div className={`${styles.formGroup} ${styles.paramDescription}`}>
                <label className={styles.label}>Param Description</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Describe the parameter"
                  value={formData.param_description}
                  onChange={(e) => handleInputChange(e, "param_description")}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Tool"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
