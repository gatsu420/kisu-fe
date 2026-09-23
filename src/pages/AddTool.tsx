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
  project: string;
  dataset: string;
  table_name: string;
  columns: Column[];
  query: Query[];
}

export default function AddTool() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ToolType>("table");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Index of the column checked as Param. Its name becomes param_name.
  const [paramIndex, setParamIndex] = useState<number | null>(null);

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
    project: "",
    dataset: "",
    table_name: "",
    columns: [{ name: "", type: "", description: "" }],
    query: [{ description: "", query: "" }],
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
    if (paramIndex === index) setParamIndex(null);
    else if (paramIndex !== null && index < paramIndex) {
      setParamIndex(paramIndex - 1);
    }
  };

  const toggleParam = (index: number, checked: boolean) => {
    setParamIndex(checked ? index : null);
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
    const missingTableName = mode === "table" && !formData.table_name.trim();
    const paramColumn =
      paramIndex !== null ? formData.columns[paramIndex] : undefined;
    if (
      !formData.tool_description.trim() ||
      !formData.project.trim() ||
      !formData.dataset.trim() ||
      missingTableName ||
      !paramColumn ||
      !paramColumn.name.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await addTool({
        tool_description: formData.tool_description,
        project: formData.project,
        dataset: formData.dataset,
        table_name: mode === "table" ? formData.table_name : "",
        columns: formData.columns,
        type: mode,
        examples: formData.query,
        param_name: paramColumn.name.trim(),
        param_type: "",
        param_description: "",
      });
      setSuccess(true);
      // Reset form
      setFormData({
        tool_description: "",
        project: "",
        dataset: "",
        table_name: "",
        columns: [{ name: "", type: "", description: "" }],
        query: [{ description: "", query: "" }],
      });
      setParamIndex(null);
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
    <div className={styles.section}>
      <p className={styles.sectionHeader}>Example</p>
      {mode === "table" ? (
        <div className={styles.greyCardList}>
          {formData.query.map((entry, index) => (
            <div
              key={index}
              className={`${styles.greyCard} ${styles.exampleCard}`}
            >
              {formData.query.length > 1 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeQuery(index)}
                >
                  x
                </button>
              )}
              <div className={styles.formGroup}>
                <div className={styles.fieldHead}>
                  <label className={styles.label}>Description</label>
                </div>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. find user by email"
                  value={entry.description}
                  onChange={(e) =>
                    handleQueryChange(index, "description", e.target.value)
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Query</label>
                <textarea
                  className={styles.textarea}
                  placeholder="e.g. SELECT * FROM users WHERE email = ?"
                  value={entry.query}
                  rows={3}
                  onChange={(e) =>
                    handleQueryChange(index, "query", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. find user by email"
              value={formData.query[0].description}
              onChange={(e) =>
                handleQueryChange(0, "description", e.target.value)
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Query</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. SELECT * FROM users WHERE email = ?"
              value={formData.query[0].query}
              rows={3}
              onChange={(e) => handleQueryChange(0, "query", e.target.value)}
            />
          </div>
        </>
      )}
      {mode === "table" && (
        <button type="button" className={styles.addBtn} onClick={addQuery}>
          + Add Example
        </button>
      )}
    </div>
  );

  const columnsForm = (
    <div className={styles.section}>
      <p className={styles.sectionHeader}>Columns</p>
      <div className={styles.greyCardList}>
        {formData.columns.map((col, index) => (
          <div key={index} className={styles.greyCard}>
            <div className={styles.formGroup}>
              <div className={styles.arrayRow}>
                <span className={styles.arrayLabel}>Name</span>
                <span className={styles.arrayLabel}>Type</span>
                <span className={styles.arrayLabelFixed}>Set as param</span>
                {formData.columns.length > 1 && (
                  <span className={styles.removeSpacer} />
                )}
              </div>
              <div className={styles.arrayRow}>
                <input
                  className={styles.arrayInput}
                  type="text"
                  placeholder="e.g. email"
                  value={col.name}
                  onChange={(e) =>
                    handleColumnChange(index, "name", e.target.value)
                  }
                />
                <input
                  className={styles.arrayInput}
                  type="text"
                  placeholder="e.g. string"
                  value={col.type}
                  onChange={(e) =>
                    handleColumnChange(index, "type", e.target.value)
                  }
                />
                <div className={styles.checkCol}>
                  <input
                    className={styles.check}
                    type="checkbox"
                    checked={paramIndex === index}
                    onChange={(e) => toggleParam(index, e.target.checked)}
                  />
                </div>
                {formData.columns.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeColumn(index)}
                  >
                    x
                  </button>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Description</label>
              <input
                className={styles.arrayInput}
                type="text"
                placeholder="e.g. user email"
                value={col.description}
                onChange={(e) =>
                  handleColumnChange(index, "description", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className={styles.addBtn} onClick={addColumn}>
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
            {/* Description */}
            <div className={styles.section}>
              <p className={styles.sectionHeader}>Description</p>
              <div className={styles.formGroup}>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe what this tool does..."
                  value={formData.tool_description}
                  onChange={(e) => handleInputChange(e, "tool_description")}
                  rows={3}
                />
              </div>
            </div>

            {/* Location */}
            <div className={styles.section}>
              <p className={styles.sectionHeader}>Location</p>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Project</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. my-project"
                    value={formData.project}
                    onChange={(e) => handleInputChange(e, "project")}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Dataset</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. my_dataset"
                    value={formData.dataset}
                    onChange={(e) => handleInputChange(e, "dataset")}
                  />
                </div>
                {mode === "table" && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Table Name</label>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="e.g. users"
                      value={formData.table_name}
                      onChange={(e) => handleInputChange(e, "table_name")}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Table: Columns then Example. Query: Example then Columns. */}
            {mode === "table" ? columnsForm : queryForm}
            {mode === "table" ? queryForm : columnsForm}

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
