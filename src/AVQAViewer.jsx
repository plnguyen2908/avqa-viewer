// Main Viewer Page - AVQA

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./index.css";

const supabase = createClient("https://dukoobhuwmiyyjapevht.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1a29vYmh1d21peXlqYXBldmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDI5MDMsImV4cCI6MjA2NTY3ODkwM30.HL_bfVyzgHcNazmABOtA-5zbsKqnJnSfX8WuHEuS4h0");

const CATEGORY_OPTIONS = ["Perception", "Reasoning"];
const SUBCATEGORY_OPTIONS = ["Coarse Perception", "Fine-grained Perception", "Temporal"];
const TASK_OPTIONS = ["Speech Order Recognition ", "Speaker Identification", "Speaker Counting", "Activity Recognition", "Speech matching", "Emotion Detection", "Celebrity Recognition"];
const VIDEO_TYPE_OPTIONS = ["movie clip", "interview"];

export default function AVQAViewer() {
  const [data, setData] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newVideoURL, setNewVideoURL] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ video_id: "", video_type: "", category: "", sub_category: "", task_id: "", approved: "", annotated: "" });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const perPage = 30;

 useEffect(() => {
  fetchData();
}, [page]);

  useEffect(() => {
    setPage(1); // Reset về trang đầu khi thay đổi filter
    fetchData();
  }, [filters]);


  const fetchData = async () => {
    let query = supabase.from("avqa_annotations").select("*").order("created_at", { ascending: false });
    // ⚠️ BỎ QUA filter annotated ở đây!
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && key !== "annotated") {
      if (key === "approved") {
        query = query.eq("approved", value === "true");
      } else if (key === "video_type") {
        query = query.eq("video_type", value);
      } else {
        query = query.ilike(key, `%${value}%`);
      }
    }
  });

  const { data: rows } = await query;
  if (!rows) return;

  // ✅ Lọc theo annotated sau khi đã lấy hết dữ liệu
  let filtered = rows;
  if (filters.annotated === "true") {
    filtered = rows.filter(row =>
      row.category && row.sub_category && row.task_id &&
      row.question && Array.isArray(row.choices) && row.choices.length === 4 &&
      row.choices.every(c => typeof c === "string" && c.trim() !== "") &&
      row.answer && row.reason
    );
  } else if (filters.annotated === "false") {
    filtered = rows.filter(row =>
      !(
        row.category && row.sub_category && row.task_id &&
        row.question && Array.isArray(row.choices) && row.choices.length === 4 &&
        row.choices.every(c => typeof c === "string" && c.trim() !== "") &&
        row.answer && row.reason
      )
    );
  }

  setData(filtered);
};

  const downloadApproved = async () => {
    const { data: approved } = await supabase
      .from("avqa_annotations")
      .select("*")
      .eq("approved", true);
      
    const groupedMap = {};
approved.forEach(row => {
  if (!groupedMap[row.video_id]) {
    groupedMap[row.video_id] = [];
  }
  groupedMap[row.video_id].push({
    category: row.category,
    sub_category: row.sub_category,
    task_id: row.task_id,
    question: row.question,
    choices: row.choices,
    answer: row.answer
  });
});

    const grouped = approved.reduce((acc, row) => {
      let group = acc.find(g => g.video_id === row.video_id);
      if (!group) {
        group = { video_id: row.video_id, questions: [] };
        acc.push(group);
      }
      group.questions.push({
        category: row.category,
        sub_category: row.sub_category,
        task_id: row.task_id,
        question: row.question,
        choices: row.choices,
        answer: row.answer
      });
      return acc;
    }, []);

    const blob = new Blob([JSON.stringify(grouped, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "approved_avqa.json";
    link.click();
  };

  const updateChoice = (index, value) => {
    const updated = draft.choices.slice();
    while (updated.length < 4) updated.push("");
    updated[index] = value;
    setDraft(prev => ({ ...prev, choices: updated }));
  };

  const updateField = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const saveEdits = async (id) => {
    if (!draft.category || !draft.sub_category || !draft.task_id || !draft.question || !draft.answer || !draft.reason) {
      return setError("⚠️ All fields must be filled.");
    }
    const filled = draft.choices.filter(Boolean);
    if (filled.length !== 4) {
      return setError("⚠️ Exactly 4 choices must be filled (one per input).\n");
    }
    const labeledChoices = draft.choices.map((c, i) => `${"ABCD"[i]}. ${c.trim()}`);
    const payload = { ...draft, choices: labeledChoices };

    setError("");
    await supabase.from("avqa_annotations").update(payload).eq("id", id);
    setEditingId(null);
    setDraft(null);
    fetchData();
  };

  const addNewCard = async () => {
    try {
      const url = new URL(newVideoURL);
      const video_id = url.searchParams.get("v");
      if (!video_id) return alert("⚠️ YouTube URL must contain '?v=' param");

      const { error } = await supabase.from("avqa_annotations").insert({ video_id });
      if (error) throw error;
      setNewVideoURL("");
      fetchData();
    } catch (err) {
      alert("❌ Invalid YouTube URL. Must be like: https://www.youtube.com/watch?v=...");
    }
  };

  const handleLogin = (username, password) => {
    if (username === "admin" && password === "AdMin") {
      setIsAdmin(true);
    } else {
      alert("Invalid credentials");
    }
  };

  const approveCard = async (id) => {
    await supabase.from("avqa_annotations").update({ approved: true }).eq("id", id);
    fetchData();
  };

  const toggleEdit = (item) => {
    if (editingId === item.id) {
      saveEdits(item.id);
    } else {
      setEditingId(item.id);
      setError("");
      let paddedChoices = item.choices?.map(c => c.replace(/^\w\.\s/, "")) || [];
      while (paddedChoices.length < 4) paddedChoices.push("");
      setDraft({
        category: item.category || "",
        sub_category: item.sub_category || "",
        task_id: item.task_id || "",
        question: item.question || "",
        choices: paddedChoices,
        answer: item.answer || "",
        reason: item.reason || ""
      });
    }
  };

  const pageData = data.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(data.length / perPage);

  return (
    <div className="container">
      <header className="header-bar">
        <h1 className="header-title">AVQA Bench Annotation Viewer</h1>
        <div className="login-bar">
          {!isAdmin ? (
            <>
              <input id="username" placeholder="Username" className="input" />
              <input id="password" type="password" placeholder="Password" className="input" />
              <button onClick={() => handleLogin(document.getElementById("username").value, document.getElementById("password").value)} className="btn success">Sign In</button>
            </>
          ) : (
            <>
              <span className="admin-label">👤 Admin</span>
              <button className="btn" onClick={() => setIsAdmin(false)}>🔓 Logout</button>
              <button className="btn dark" onClick={downloadApproved}>⬇️ Download JSON</button>
            </>
          )}
        </div>
      </header>

      <div className="controls">
        <input type="text" placeholder="YouTube link" value={newVideoURL} onChange={(e) => setNewVideoURL(e.target.value)} className="input" />
        <button onClick={addNewCard} className="btn primary">➕ Add</button>
      </div>

      <div className="filters">
        <input placeholder="video_id" className="input" value={filters.video_id} onChange={e => setFilters({ ...filters, video_id: e.target.value })} onBlur={fetchData} />
        <select
          className="input"
          value={filters.video_type}
          onChange={e => setFilters({ ...filters, video_type: e.target.value })}
        >
          <option value="">-- Video Type --</option>
          {VIDEO_TYPE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <select className="input" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} onBlur={fetchData}>
          <option value="">-- Category --</option>
          {CATEGORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
        </select>
        <select className="input" value={filters.sub_category} onChange={e => setFilters({ ...filters, sub_category: e.target.value })} onBlur={fetchData}>
          <option value="">-- Sub-category --</option>
          {SUBCATEGORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
        </select>
        <select className="input" value={filters.task_id} onChange={e => setFilters({ ...filters, task_id: e.target.value })} onBlur={fetchData}>
          <option value="">-- Task ID --</option>
          {TASK_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
        </select>
        <select className="input" value={filters.annotated} onChange={e => setFilters({ ...filters, annotated: e.target.value })}>
          <option value="">-- Annotated --</option>
          <option value="true">✅ Annotated</option>
          <option value="false">❌ Not Annotated</option>
        </select>

        <select className="input" value={filters.approved} onChange={e => setFilters({ ...filters, approved: e.target.value })} onBlur={fetchData}>
          <option value="">-- Approved --</option>
          <option value="true">✅ Approved</option>
          <option value="false">❌ Not Approved</option>
        </select>
      </div>

      <div className="grid3">
        {pageData.map(item => (
          <div key={item.id} className="card">
            <iframe width="100%" height="180" src={`https://www.youtube.com/embed/${item.video_id}`} allowFullScreen title="YouTube Player" className="iframe" />
            <p><b>video_id:</b> {item.video_id}</p>
            <p><b>video_type:</b> {item.video_type || '-'}</p>
            <p><b>category:</b> {editingId === item.id ? (
              <select className="input" value={draft.category} onChange={e => updateField("category", e.target.value)}>
                <option value="">-- Category --</option>
                {CATEGORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            ) : (item.category || '-')}</p>

            <p><b>sub_category:</b> {editingId === item.id ? (
              <select className="input" value={draft.sub_category} onChange={e => updateField("sub_category", e.target.value)}>
                <option value="">-- Sub-category --</option>
                {SUBCATEGORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            ) : (item.sub_category || '-')}</p>

            <p><b>task_id:</b> {editingId === item.id ? (
              <select className="input" value={draft.task_id} onChange={e => updateField("task_id", e.target.value)}>
                <option value="">-- Task ID --</option>
                {TASK_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            ) : (item.task_id || '-')}</p>

            <p><b>approved:</b> {item.approved ? '✅' : '❌'}</p>

            <p><b>question:</b> {editingId === item.id ? (
              <textarea className="input" value={draft.question} onChange={e => updateField("question", e.target.value)} />
            ) : (item.question || '-')}</p>

            <p><b>choices:</b></p>
            {editingId === item.id ? (
              draft.choices.map((choice, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                  <label><b>{"ABCD"[idx]}. </b></label>
                  <input className="input" value={choice} onChange={e => updateChoice(idx, e.target.value)} />
                </div>
              ))
            ) : <div style={{ whiteSpace: 'pre-line' }}>
              {(item.choices || []).join('\n')}
            </div>
            }

            <p><b>answer:</b> {editingId === item.id ? (
            <select className="input" value={draft.answer} onChange={e => updateField("answer", e.target.value)}>
                <option value="">-- Answer --</option>
                {["A", "B", "C", "D"].map(opt => <option key={opt}>{opt}</option>)}
            </select>
            ) : (item.answer || '-')}</p>


            <p><b>reason for the answer (timestamp, ...):</b> {editingId === item.id ? (
              <textarea className="input" value={draft.reason} onChange={e => updateField("reason", e.target.value)} />
            ) : (item.reason || '-')}</p>

            {error && editingId === item.id && (
              <p style={{ color: 'red', fontWeight: 'bold', marginTop: '0.75rem', whiteSpace: 'pre-line' }}>{error}</p>
            )}

            <div className="actions">
              <button className="btn small" disabled={item.approved && !isAdmin} onClick={() => toggleEdit(item)}>
                {editingId === item.id ? '💾' : '✏️'}
              </button>
              <button disabled={!isAdmin} onClick={() => approveCard(item.id)} className={`btn small ${isAdmin ? 'success' : 'disabled'}`}>✅</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        {page > 3 && (
          <button className="btn" onClick={() => setPage(Math.max(page - 1, 1))}>⬅️</button>
        )}
        {[...Array(totalPages).keys()].slice(Math.max(0, page - 3), page + 2).map(p => (
          <button key={p + 1} onClick={() => setPage(p + 1)} className={`btn ${page === p + 1 ? 'primary' : ''}`}>{p + 1}</button>
        ))}
        {page < totalPages - 2 && (
          <button className="btn" onClick={() => setPage(Math.min(page + 1, totalPages))}>➡️</button>
        )}
      </div>
    </div>
  );
}