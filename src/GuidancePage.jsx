import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./index.css";
import { useNavigate } from "react-router-dom";


const supabase = createClient("https://dukoobhuwmiyyjapevht.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1a29vYmh1d21peXlqYXBldmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDI5MDMsImV4cCI6MjA2NTY3ODkwM30.HL_bfVyzgHcNazmABOtA-5zbsKqnJnSfX8WuHEuS4h0");
const fixedIntro = `
  <h2>VisualAudio Benchmark — Annotator Guide</h2>
  <p><strong>Motivation.</strong> We are building a benchmark that tests models on <em>audio-visual fusion</em> — tasks that cannot be solved with audio <em>or</em> video alone.  
  Your annotations will create multiple-choice questions grounded in short clips of spoken English video, allowing us to evaluate whether models truly combine what they <em>hear</em> with what they <em>see</em>.</p>

  <p><strong>High-level workflow.</strong></p>
  <ol>
    <li>You will receive a fixed list of roughly 100 English-language YouTube videos. You’ll work exclusively with this set for about one month.</li>
    <li>For each video:
      <br>&nbsp;&nbsp;a. Add the YouTube link to our interface so it is stored in the project database.  
      <br>&nbsp;&nbsp;b. Select a <strong>30-second window</strong> (<code>start_time</code>, <code>end_time</code>).  
      <br>&nbsp;&nbsp;c. For each assigned task type (see below), watch the clip and craft one multiple-choice question.  
      <br>&nbsp;&nbsp;d. Enter the question, <strong>four</strong> answer options, and mark the correct one.  
      <br>&nbsp;&nbsp;e. Indicate whether the answer would remain identical if the question were asked about the <em>entire</em> video (<code>global_consistent</code> = true / false).
      <br>&nbsp;&nbsp;f. If you are not sure about individual example like the question & answers, please put concerns in the <code>reason for the answer</code> part so we can see it when we review.
    </li>
    </ol>

  <p><strong>Safety & content rules.</strong> Only use videos that are safe for a general audience (no graphic violence, explicit adult content, or horror). Stick to English-language videos only.</p>
  <strong>General Note</strong>
  <ul>
    <li>Option consistency: for each answer option you created, please make it consistent. For example, if choice A, B, and C are related to hair color of the individual, then option D should also refer to that.</li>
    <li> the "difficulty / answer distribution" within the same task: we will assign you with specific requirement through the <a href = "https://docs.google.com/spreadsheets/d/1cpSq3KcDQdUJa9tNP1C7X007fj6IFq0jdrY8WaMHPOU/edit?pli=1&gid=1332703279#gid=1332703279"> google sheet </a></li>
    <li> Avoid "crossing scenes":  A counter example is this video with id <strong>9mXJK86GCsI</strong> where the woman is really appearing for the ending not the main scenes.
  </ul>
  <strong>Per-task Note</strong>
  <ul>
    <li> For course perception question, we have provided the template for you</li>
    <li> For fine-grained perception and reasoning question, we will provide detailed instruction. But keep in mind that it will not have a specific template.</li>
  </ul>
  <hr />
`;
export default function EditableTaskGuide() {
  const navigate = useNavigate();
  const [taskList, setTaskList] = useState([]);
  const [filteredId, setFilteredId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  useEffect(() => {
    fetchAllTasks();
    const username = sessionStorage.getItem("admin_username");
    if (username === "admin") setIsAdmin(true);
  }, []);

  const fetchAllTasks = async () => {
    const { data } = await supabase.from("avqa_task_guidance").select("*").order("id");
    if (data) {
      const parsedTasks = data.map(row => ({
        id: row.id,
        task_name: row.task_name,
        ...JSON.parse(row.task_html),
        editing: false
      }));
      setTaskList(parsedTasks);
    }
  };

  const addNewTask = async () => {
    const payload = {
      task_name: "New Task",
      task_html: JSON.stringify({ task: "", goal: "", steps: [""], example: "" })
    };
    const { data, error } = await supabase.from("avqa_task_guidance").insert([payload]).select().single();
    if (error) return alert("❌ Failed to add task");
    fetchAllTasks();
  };

  const saveTask = async (t) => {
    const payload = {
      task_name: t.task,
      task_html: JSON.stringify({ task: t.task, goal: t.goal, steps: t.steps, example: t.example })
    };
    await supabase.from("avqa_task_guidance").update(payload).eq("id", t.id);
    fetchAllTasks();
  };

  const logout = () => {
    sessionStorage.removeItem("admin_username");
    setIsAdmin(false);
  };

  const handleLogin = () => {
    const { username, password } = loginForm;
    if (username === "admin" && password === "AdMin") {
      sessionStorage.setItem("admin_username", "admin");
      setIsAdmin(true);
    } else {
      alert("❌ Invalid credentials");
    }
  };

  const visibleTasks = filteredId ? taskList.filter(t => t.id === Number(filteredId)) : taskList;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn" onClick={() => navigate("/")}>🔙 Back to Viewer</button>
        {!isAdmin ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <input className="input" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
            <input className="input" type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
            <button className="btn success" onClick={handleLogin}>🔐 Login</button>
          </div>
        ) : (
          <div>
            <span className="admin-label">👤 admin</span>
            <button className="btn" onClick={logout}>Logout 🔓</button>
          </div>
        )}
      </div>

      <h1>Task Annotation Guide</h1>
      <div dangerouslySetInnerHTML={{ __html: fixedIntro }} />

      {/* Filter Dropdown */}
      <div style={{ marginTop: "1rem", display: "flex", gap: "10px", alignItems: "center" }}>
        <label><b>📚 Select Task:</b></label>
        <select className="input" value={filteredId} onChange={e => setFilteredId(e.target.value)}>
          <option value="">-- Show All Tasks --</option>
          {taskList.map(t => <option key={t.id} value={t.id}>{t.task_name || `Task ${t.id}`}</option>)}
        </select>
        {isAdmin && <button className="btn small" onClick={addNewTask}>➕ Add Task</button>}
      </div>

      {visibleTasks.map((t, idx) => (
        <div key={t.id} style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
          {t.editing ? (
            <>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label><b>🟦 Task Name:</b></label>
                  <input className="input" value={t.task} onChange={e => {
                    const clone = [...taskList]; clone[idx].task = e.target.value; setTaskList(clone);
                  }} />
                </div>
                <div style={{ flex: 2 }}>
                  <label><b>🎯 Goal:</b></label>
                  <input className="input" value={t.goal} onChange={e => {
                    const clone = [...taskList]; clone[idx].goal = e.target.value; setTaskList(clone);
                  }} />
                </div>
              </div>
              <label><b>📝 How to annotate:</b></label>
              {t.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                  <input className="input" value={s} onChange={e => {
                    const clone = [...taskList]; clone[idx].steps[i] = e.target.value; setTaskList(clone);
                  }} style={{ flex: 1 }} />
                  <button className="btn small danger" onClick={() => {
                    const clone = [...taskList]; clone[idx].steps.splice(i, 1); setTaskList(clone);
                  }}>❌</button>
                </div>
              ))}
              <button className="btn small" onClick={() => {
                const clone = [...taskList]; clone[idx].steps.push(""); setTaskList(clone);
              }}>➕ Add Step</button>
              <br></br>
              <label><b>🔍 Example:</b></label>
              <br />
              <textarea
                className="input"
                style={{ height: "150px", fontFamily: "monospace" }}
                value={t.example}
                onChange={e => {
                  const clone = [...taskList]; clone[idx].example = e.target.value; setTaskList(clone);
                }}
              />
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="btn success" onClick={() => saveTask(t)}>💾 Save</button>
                <button className="btn" onClick={() => {
                  const clone = [...taskList]; clone[idx].editing = false; setTaskList(clone);
                }}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <h3>🟦 Task: {t.task}</h3>
              <p><b>🎯 Goal:</b> {t.goal}</p>
              <p><b>📝 How to annotate:</b></p>
              <ul>{t.steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
              <p><b>🔍 Example:</b></p>
              <blockquote style={{ background: "#f9f9f9", padding: "1em" }}>
                <pre style={{ whiteSpace: "pre-wrap" }}>{t.example}</pre>
              </blockquote>
              {isAdmin && (
                <button className="btn" onClick={() => {
                  const clone = [...taskList]; clone[idx].editing = true; setTaskList(clone);
                }}>✏️ Edit</button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}