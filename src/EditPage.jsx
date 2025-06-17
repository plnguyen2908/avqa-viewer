import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "./index.css";

const supabase = createClient("https://dukoobhuwmiyyjapevht.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1a29vYmh1d21peXlqYXBldmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDI5MDMsImV4cCI6MjA2NTY3ODkwM30.HL_bfVyzgHcNazmABOtA-5zbsKqnJnSfX8WuHEuS4h0");

const CATEGORY_OPTIONS = ["Perception", "Reasoning", "Action"];
const SUBCATEGORY_OPTIONS = ["Coarse", "Fine", "Temporal"];
const TASK_OPTIONS = ["speech_matching", "event_localization", "qa"];
const ANSWER_OPTIONS = ["A", "B", "C", "D"];

export default function EditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("avqa_annotations").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setRecord(data);
    });
  }, [id]);

  const handleChange = (field, value) => {
    setRecord(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const requiredFields = ["category", "sub_category", "task_id", "question", "choices", "answer", "reason"];
    for (let field of requiredFields) {
      if (!record[field] || (Array.isArray(record[field]) && record[field].length === 0)) {
        setError(`Missing field: ${field}`);
        return;
      }
    }
    await supabase.from("avqa_annotations").update({
      category: record.category,
      sub_category: record.sub_category,
      task_id: record.task_id,
      question: record.question,
      choices: record.choices,
      answer: record.answer,
      reason: record.reason
    }).eq("id", id);
    navigate("/");
  };

  if (!record) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2 className="header-title">Edit Annotation</h2>

      <div className="form">
        <label>Category:</label>
        <select className="input" value={record.category || ""} onChange={e => handleChange("category", e.target.value)}>
          <option value="">--Select--</option>
          {CATEGORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
        </select>

        <label>Sub-category:</label>
        <select className="input" value={record.sub_category || ""} onChange={e => handleChange("sub_category", e.target.value)}>
          <option value="">--Select--</option>
          {SUBCATEGORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
        </select>

        <label>Task ID:</label>
        <select className="input" value={record.task_id || ""} onChange={e => handleChange("task_id", e.target.value)}>
          <option value="">--Select--</option>
          {TASK_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
        </select>

        <label>Question:</label>
        <textarea className="input" value={record.question || ""} onChange={e => handleChange("question", e.target.value)} />

        <label>Choices (comma separated):</label>
        <input className="input" value={record.choices?.join(", ") || ""} onChange={e => handleChange("choices", e.target.value.split(",").map(s => s.trim()))} />

        <label>Answer:</label>
        <select className="input" value={record.answer || ""} onChange={e => handleChange("answer", e.target.value)}>
          <option value="">--Select--</option>
          {ANSWER_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
        </select>

        <label>Reason:</label>
        <textarea className="input" value={record.reason || ""} onChange={e => handleChange("reason", e.target.value)} />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button className="btn primary" onClick={handleSubmit}>✅ Submit</button>
      </div>
    </div>
  );
}
