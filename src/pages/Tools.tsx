import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { addTool } from "../lib/api";
import styles from "./Tools.module.css";

interface Column {
  name: string;
  type: string;
  description: string;
}

interface QueryExample {
  description: string;
  query: string;
}

interface FormData {
  tool_description: string;
  table_name: string;
  columns: Column[];
  query_examples: QueryExample[];
  param_name: string;
  param_type: string;
  param_description: string;
}

export default function Tools() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    tool_description: "",
    table_name: "",
    columns: [{ name: "", type: "", description: "" }],
    query_examples: [{ description: "", query: "" }],
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

  const handleQueryExampleChange = (
    index: number,
    field: keyof QueryExample,
    value: string,
  ) => {
    const newExamples = [...formData.query_examples];
    newExamples[index] = { ...newExamples[index], [field]: value };
    setFormData((prev) => ({ ...prev, query_examples: newExamples }));
  };

  const addQueryExample = () => {
    setFormData((prev) => ({
      ...prev,
      query_examples: [
        ...prev.query_examples,
        { description: "", query: "" },
      ],
    }));
  };

  const removeQueryExample = (index: number) => {
    if (formData.query_examples.length <= 1) return;
    const newExamples = formData.query_examples.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, query_examples: newExamples }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate
    if (
      !formData.tool_description.trim() ||
      !formData.table_name.trim() ||
      !formData.param_name.trim() ||
      !formData.param_type.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await addTool(formData);
      setSuccess(true);
      // Reset form
      setFormData({
        tool_description: "",
        table_name: "",
        columns: [{ name: "", type: "", description: "" }],
        query_examples: [{ description: "", query: "" }],
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo}>kisu</h1>
        <nav className={styles.nav}>
          <button
            className={styles.navBtn}
            onClick={() => navigate("/")}
          >
            Dashboard
          </button>
          <button
            className={`${styles.navBtn} ${styles.navBtnActive}`}
            onClick={() => navigate("/tools")}
          >
            Tools
          </button>
        </nav>
        <button
          className={styles.signOutBtn}
          onClick={() => navigate("/login?signout")}
        >
          Sign out
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Add New Tool</h2>

          {success && (
            <div className={styles.success}>
              Tool added successfully! You can now use it in the Dashboard.
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

            {/* Columns */}
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

            {/* Query Examples */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Query Examples</label>
              {formData.query_examples.map((example, index) => (
                <div key={index} className={styles.arrayRow}>
                  <input
                    className={styles.arrayInput}
                    type="text"
                    placeholder="Description"
                    value={example.description}
                    onChange={(e) =>
                      handleQueryExampleChange(
                        index,
                        "description",
                        e.target.value,
                      )
                    }
                  />
                  <input
                    className={styles.arrayInput}
                    type="text"
                    placeholder="SQL query"
                    value={example.query}
                    onChange={(e) =>
                      handleQueryExampleChange(index, "query", e.target.value)
                    }
                  />
                  {formData.query_examples.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeQueryExample(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className={styles.addBtn}
                onClick={addQueryExample}
              >
                + Add Query Example
              </button>
            </div>

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
