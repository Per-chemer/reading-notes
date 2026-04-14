import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import "./App.css";

const initialForm = {
  title: "",
  bookTitle: "",
  chapter: "",
  content: "",
  tags: "",
  rating: 0,
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [noteForm, setNoteForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setNotes([]);
      return;
    }

    localStorage.setItem("token", token);
    void (async () => {
      try {
        setLoading(true);
        const [profile, notesResp] = await Promise.all([api.me(), api.listNotes()]);
        setUser(profile.user);
        setNotes(notesResp.notes);
      } catch (error) {
        setMessage(error.message);
        localStorage.removeItem("token");
        setToken("");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function loadProfileAndNotes(searchValue = keyword) {
    try {
      setLoading(true);
      const [profile, notesResp] = await Promise.all([api.me(), api.listNotes(searchValue)]);
      setUser(profile.user);
      setNotes(notesResp.notes);
    } catch (error) {
      setMessage(error.message);
      localStorage.removeItem("token");
      setToken("");
    } finally {
      setLoading(false);
    }
  }

  function resetNoteForm() {
    setNoteForm(initialForm);
    setEditingId(null);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      const payload = { email: authForm.email.trim(), password: authForm.password };
      const result = authMode === "register" ? await api.register(payload) : await api.login(payload);
      setToken(result.token);
      setAuthForm({ email: "", password: "" });
      setMessage(authMode === "register" ? "注册成功，已自动登录。" : "登录成功。");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadProfileAndNotes(keyword);
  }

  async function handleSaveNote(event) {
    event.preventDefault();
    const payload = {
      ...noteForm,
      tags: noteForm.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      rating: Number(noteForm.rating) || 0,
    };

    try {
      setLoading(true);
      setMessage("");
      if (isEditing) {
        await api.updateNote(editingId, payload);
        setMessage("笔记已更新。");
      } else {
        await api.createNote(payload);
        setMessage("笔记已创建。");
      }
      resetNoteForm();
      await loadProfileAndNotes();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(note) {
    setEditingId(note.id);
    setNoteForm({
      title: note.title,
      bookTitle: note.bookTitle,
      chapter: note.chapter || "",
      content: note.content,
      tags: (note.tags || []).join(", "),
      rating: note.rating || 0,
    });
  }

  async function handleDelete(id) {
    try {
      setLoading(true);
      setMessage("");
      await api.deleteNote(id);
      if (editingId === id) {
        resetNoteForm();
      }
      await loadProfileAndNotes();
      setMessage("笔记已删除。");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setMessage("你已退出登录。");
    setAuthMode("login");
    setAuthForm({ email: "", password: "" });
    resetNoteForm();
  }

  if (!token) {
    return (
      <main className="page">
        <section className="card">
          <h1>读书笔记 MVP</h1>
          <p className="muted">邮箱密码登录，云端保存，随时随地查看。</p>

          <div className="tab-row">
            <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
              登录
            </button>
            <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>
              注册
            </button>
          </div>

          <form className="form" onSubmit={handleAuthSubmit}>
            <label>
              邮箱
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label>
              密码
              <input
                type="password"
                minLength={6}
                required
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "处理中..." : authMode === "register" ? "注册并登录" : "登录"}
            </button>
          </form>

          {message ? <p className="message">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>读书笔记</h1>
          <p className="muted">{user ? `当前用户：${user.email}` : "正在加载用户..."}</p>
        </div>
        <button type="button" onClick={logout}>
          退出
        </button>
      </header>

      <section className="grid">
        <article className="card">
          <h2>{isEditing ? "编辑笔记" : "新建笔记"}</h2>
          <form className="form" onSubmit={handleSaveNote}>
            <label>
              标题
              <input
                required
                value={noteForm.title}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label>
              书名
              <input
                required
                value={noteForm.bookTitle}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, bookTitle: event.target.value }))}
              />
            </label>
            <label>
              章节
              <input
                value={noteForm.chapter}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, chapter: event.target.value }))}
              />
            </label>
            <label>
              标签（逗号分隔）
              <input
                value={noteForm.tags}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, tags: event.target.value }))}
              />
            </label>
            <label>
              评分（0-5）
              <input
                type="number"
                min={0}
                max={5}
                value={noteForm.rating}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, rating: event.target.value }))}
              />
            </label>
            <label>
              内容
              <textarea
                required
                rows={8}
                value={noteForm.content}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, content: event.target.value }))}
              />
            </label>
            <div className="button-row">
              <button type="submit" disabled={loading}>
                {loading ? "保存中..." : isEditing ? "更新笔记" : "创建笔记"}
              </button>
              {isEditing ? (
                <button type="button" className="secondary" onClick={resetNoteForm}>
                  取消编辑
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="card">
          <h2>我的笔记</h2>
          <form className="search-row" onSubmit={handleSearch}>
            <input
              placeholder="按标题/书名/内容搜索"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button type="submit" disabled={loading}>
              搜索
            </button>
          </form>

          {notes.length === 0 ? <p className="muted">暂无笔记，先创建一条吧。</p> : null}

          <ul className="note-list">
            {notes.map((note) => (
              <li key={note.id}>
                <h3>{note.title}</h3>
                <p className="meta">
                  《{note.bookTitle}》 {note.chapter ? `· ${note.chapter}` : ""} · 评分 {note.rating}
                </p>
                <p>{note.content}</p>
                <p className="meta">{(note.tags || []).join(", ")}</p>
                <div className="button-row">
                  <button type="button" className="secondary" onClick={() => startEdit(note)}>
                    编辑
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(note.id)}>
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {message ? <p className="message">{message}</p> : null}
    </main>
  );
}

export default App;
