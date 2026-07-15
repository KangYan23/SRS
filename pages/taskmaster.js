import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ─── helpers ────────────────────────────────────────────────────────────────

const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_COLORS = {
  low: "bg-green-500/20 text-green-300 border-green-500/40",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  high: "bg-red-500/20 text-red-300 border-red-500/40",
};

function fmt(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function isOverdue(d) { return d && new Date(d) < new Date(); }
function isDueSoon(d, h = 24) {
  if (!d) return false;
  const diff = new Date(d) - new Date();
  return diff > 0 && diff < h * 3600000;
}
function isToday(d) {
  if (!d) return false;
  const t = new Date(d), n = new Date();
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() && t.getDate() === n.getDate();
}
function startOfWeek() {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}
function isFriday() { return new Date().getDay() === 5; }
function mmss(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

// ─── undo toast ─────────────────────────────────────────────────────────────

function UndoToast({ task, onUndo, onDismiss }) {
  const [secs, setSecs] = useState(6);
  useEffect(() => {
    if (secs <= 0) { onDismiss(); return; }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onDismiss]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-800 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <span className="text-sm text-white/80">✓ <span className="font-medium">{task.title}</span> completed</span>
      <button onClick={onUndo} className="text-sm text-blue-400 hover:text-blue-300 font-semibold border border-blue-500/40 rounded-lg px-3 py-1 transition-colors">
        ↩ Undo ({secs})
      </button>
    </div>
  );
}

// ─── pomodoro timer ──────────────────────────────────────────────────────────

function PomodoroTimer({ task, onClose }) {
  const WORK = 25 * 60, BREAK = 5 * 60;
  const [phase, setPhase] = useState("work");
  const [secs, setSecs] = useState(WORK);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (phase === "work") {
              if (Notification.permission === "granted")
                new Notification("🍅 Pomodoro done!", { body: `Break time — ${task.title}`, icon: "/icons/icon-192.png" });
              setPhase("break"); setSecs(BREAK);
            } else {
              if (Notification.permission === "granted")
                new Notification("☕ Break over!", { body: "Ready for another round?", icon: "/icons/icon-192.png" });
              setPhase("work"); setSecs(WORK);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running, phase, task.title]);

  const pct = phase === "work" ? ((WORK - secs) / WORK) * 100 : ((BREAK - secs) / BREAK) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#12121a] border border-white/10 rounded-2xl p-5 shadow-2xl w-72">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">{phase === "work" ? "🍅 Focus" : "☕ Break"}</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg leading-none">×</button>
      </div>
      <p className="text-xs text-white/40 truncate mb-3">{task.title}</p>
      <div className="text-4xl font-mono font-bold text-white text-center mb-3">{mmss(secs)}</div>
      <div className="h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${phase === "work" ? "bg-red-400" : "bg-green-400"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${running ? "bg-white/10 text-white/70" : "bg-red-500 hover:bg-red-400 text-white"}`}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={() => { setRunning(false); setPhase("work"); setSecs(WORK); }} className="px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-sm transition-colors">↺</button>
      </div>
    </div>
  );
}

// ─── daily briefing modal ────────────────────────────────────────────────────

function DailyBriefingModal({ tasks, onClose }) {
  const now = new Date();
  const overdue = tasks.filter(t => !t.completed && isOverdue(t.dueDate));
  const todayTasks = tasks.filter(t => !t.completed && isToday(t.dueDate) && !isOverdue(t.dueDate));
  const highPriority = tasks.filter(t => !t.completed && t.priority === "high" && !isOverdue(t.dueDate) && !isToday(t.dueDate));
  const pending = tasks.filter(t => !t.completed).length;
  const done = tasks.filter(t => t.completed).length;

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-[#12121a] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">☀️ {greeting}!</h2>
            <p className="text-white/40 text-sm">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{pending}</div>
            <div className="text-xs text-white/40">pending</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{done}</div>
            <div className="text-xs text-white/40">completed</div>
          </div>
        </div>

        {overdue.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">🔴 Overdue — needs immediate attention</p>
            {overdue.map(t => (
              <div key={t._id} className="text-sm text-white/80 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-1.5">
                {t.title} <span className="text-red-400 text-xs ml-1">· {fmt(t.dueDate)}</span>
              </div>
            ))}
          </div>
        )}

        {todayTasks.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">🟡 Due today</p>
            {todayTasks.map(t => (
              <div key={t._id} className="text-sm text-white/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-1.5">
                {t.title} <span className="text-yellow-400 text-xs ml-1">· {fmtTime(t.dueDate)}</span>
              </div>
            ))}
          </div>
        )}

        {highPriority.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">🔵 High priority upcoming</p>
            {highPriority.slice(0, 5).map(t => (
              <div key={t._id} className="text-sm text-white/80 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-1.5">
                {t.title} {t.dueDate && <span className="text-blue-400 text-xs ml-1">· {fmt(t.dueDate)}</span>}
              </div>
            ))}
          </div>
        )}

        {overdue.length === 0 && todayTasks.length === 0 && highPriority.length === 0 && (
          <p className="text-center text-white/30 py-4">You&apos;re all caught up! 🎉</p>
        )}

        <button onClick={onClose} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium transition-colors">
          Let&apos;s get started
        </button>
      </div>
    </div>
  );
}

// ─── weekly report modal ─────────────────────────────────────────────────────

function WeeklyReportModal({ tasks, onClose }) {
  const weekStart = startOfWeek();
  const thisWeek = tasks.filter(t => new Date(t.createdAt) >= weekStart);
  const completedWeek = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= weekStart);
  const overdueCount = tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length;
  const rate = thisWeek.length > 0 ? Math.round((completedWeek.length / thisWeek.length) * 100) : 0;

  const byCategory = completedWeek.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-[#12121a] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">📊 Weekly Report</h2>
            <p className="text-white/40 text-sm">Week of {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Created this week", value: thisWeek.length, color: "text-white" },
            { label: "Completed this week", value: completedWeek.length, color: "text-green-400" },
            { label: "Completion rate", value: `${rate}%`, color: rate >= 70 ? "text-green-400" : rate >= 40 ? "text-yellow-400" : "text-red-400" },
            { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "text-red-400" : "text-green-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full ${rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${rate}%` }} />
          </div>
          <p className="text-xs text-white/40 text-center">{rate}% completion rate this week</p>
        </div>

        {Object.keys(byCategory).length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Completed by category</p>
            {Object.entries(byCategory).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/70">{cat}</span>
                <span className="text-sm font-semibold text-green-400">{count} done</span>
              </div>
            ))}
          </div>
        )}

        {completedWeek.length === 0 && (
          <p className="text-center text-white/30 py-4 text-sm">No tasks completed this week yet — you&apos;ve got this! 💪</p>
        )}

        <button onClick={onClose} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

// ─── task form ───────────────────────────────────────────────────────────────

function TaskForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: "", description: "", category: categories[0] || "General",
    priority: "medium", dueDate: "", dailyReset: false,
    urgent: false, important: false,
    ...initial,
    dueDate: initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 16) : "",
  });
  const [newCat, setNewCat] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = e => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const cat = newCat.trim() || form.category;
    onSave({ ...form, category: cat === "__new__" ? newCat.trim() || "General" : cat, dueDate: form.dueDate || null });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-400"
        placeholder="Task title *" value={form.title} onChange={e => set("title", e.target.value)} required />
      <textarea className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-400 resize-none"
        placeholder="Description (optional)" rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Category</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            value={form.category} onChange={e => set("category", e.target.value)}>
            {categories.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
            <option value="__new__" className="bg-gray-900">+ New category…</option>
          </select>
          {form.category === "__new__" && (
            <input className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-400"
              placeholder="Category name" value={newCat} onChange={e => setNewCat(e.target.value)} />
          )}
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Priority</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            value={form.priority} onChange={e => set("priority", e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p} className="bg-gray-900 capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">🔔 Due date & time (reminder)</label>
        <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
          value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[["urgent","⚡ Urgent","border-red-500/40 data-[on=true]:bg-red-500/20 data-[on=true]:border-red-400 data-[on=true]:text-red-300"],
          ["important","⭐ Important","border-blue-500/40 data-[on=true]:bg-blue-500/20 data-[on=true]:border-blue-400 data-[on=true]:text-blue-300"]
        ].map(([key, label, cls]) => (
          <button key={key} type="button" data-on={form[key]}
            onClick={() => set(key, !form[key])}
            className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${cls} ${form[key] ? "" : "text-white/40 border-white/10"}`}>
            {label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" className="rounded accent-blue-400" checked={form.dailyReset} onChange={e => set("dailyReset", e.target.checked)} />
        <span className="text-sm text-white/70">Daily recurring task</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 font-medium transition-colors">
          {initial ? "Save changes" : "Add task"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="px-4 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg py-2 transition-colors">Cancel</button>}
      </div>
    </form>
  );
}

// ─── task card ───────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onEdit, onDelete, onPomodoro }) {
  const overdue = !task.completed && isOverdue(task.dueDate);
  const soon = !task.completed && isDueSoon(task.dueDate);
  return (
    <div className={`group relative bg-white/5 border rounded-xl p-4 transition-all ${
      task.completed ? "border-white/5 opacity-60" : overdue ? "border-red-500/40" : soon ? "border-yellow-500/40" : "border-white/10 hover:border-white/20"}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggle(task)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${task.completed ? "bg-blue-500 border-blue-500" : "border-white/30 hover:border-blue-400"}`}>
          {task.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm ${task.completed ? "line-through text-white/40" : "text-white"}`}>{task.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
            {task.urgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">⚡</span>}
            {task.important && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">⭐</span>}
            {task.dailyReset && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">daily</span>}
          </div>
          {task.description && <p className="text-xs text-white/50 mt-0.5 truncate">{task.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{task.category}</span>
            {task.dueDate && (
              <span className={`text-xs ${overdue ? "text-red-400" : soon ? "text-yellow-400" : "text-white/40"}`}>
                🔔 {overdue ? "Overdue · " : soon ? "Due soon · " : ""}{fmt(task.dueDate)} {fmtTime(task.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!task.completed && (
            <button onClick={() => onPomodoro(task)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Pomodoro">🍅</button>
          )}
          <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Edit">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button onClick={() => onDelete(task._id)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── matrix view ─────────────────────────────────────────────────────────────

const QUADRANTS = [
  { key: "do",       label: "Do Now",    desc: "Urgent + Important",     urgent: true,  important: true,  color: "border-red-500/40 bg-red-500/5",    badge: "bg-red-500/20 text-red-300" },
  { key: "schedule", label: "Schedule",  desc: "Not Urgent + Important", urgent: false, important: true,  color: "border-blue-500/40 bg-blue-500/5",  badge: "bg-blue-500/20 text-blue-300" },
  { key: "delegate", label: "Delegate",  desc: "Urgent + Not Important", urgent: true,  important: false, color: "border-yellow-500/40 bg-yellow-500/5", badge: "bg-yellow-500/20 text-yellow-300" },
  { key: "eliminate",label: "Eliminate", desc: "Not Urgent + Not Important", urgent: false, important: false, color: "border-white/10 bg-white/5", badge: "bg-white/10 text-white/40" },
];

function MatrixView({ tasks, onToggle, onEdit, onDelete, onPomodoro }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QUADRANTS.map(q => {
        const qTasks = tasks.filter(t => !t.completed && t.urgent === q.urgent && t.important === q.important);
        return (
          <div key={q.key} className={`border rounded-xl p-4 ${q.color}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.badge}`}>{q.label}</span>
              <span className="text-xs text-white/30">{q.desc}</span>
              <span className="ml-auto text-xs text-white/30">{qTasks.length}</span>
            </div>
            {qTasks.length === 0
              ? <p className="text-xs text-white/20 text-center py-4">No tasks here</p>
              : <div className="space-y-2">{qTasks.map(t => <TaskCard key={t._id} task={t} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onPomodoro={onPomodoro} />)}</div>
            }
          </div>
        );
      })}
    </div>
  );
}

// ─── list view ───────────────────────────────────────────────────────────────

function ListView({ tasks, onToggle, onEdit, onDelete, onPomodoro }) {
  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pOrder = { high: 0, medium: 1, low: 2 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
  return (
    <div className="space-y-2">
      {sorted.map(t => <TaskCard key={t._id} task={t} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onPomodoro={onPomodoro} />)}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function TaskMaster() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState({ category: "All", priority: "all", status: "all" });
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);
  const [undoEntry, setUndoEntry] = useState(null);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const notifRef = useRef(null);
  const undoTimerRef = useRef(null);
  const pendingCompleteRef = useRef(null);

  const showNotif = useCallback((msg, type = "info") => {
    setNotification({ msg, type });
    clearTimeout(notifRef.current);
    notifRef.current = setTimeout(() => setNotification(null), 3500);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } catch { showNotif("Failed to load tasks", "error"); }
    finally { setLoading(false); }
  }, [showNotif]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // request notification permission + reminder check
  useEffect(() => {
    if (!("Notification" in window)) return;
    Notification.requestPermission();
    const check = () => {
      tasks.forEach(t => {
        if (!t.completed && isDueSoon(t.dueDate, 1) && Notification.permission === "granted")
          new Notification("🔔 Task due soon", { body: t.title, icon: "/icons/icon-192.png" });
      });
    };
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, [tasks]);

  // auto-show weekly report on Fridays (once per day)
  useEffect(() => {
    if (!isFriday()) return;
    const key = `weekly-report-${new Date().toDateString()}`;
    if (!localStorage.getItem(key)) {
      setShowReport(true);
      localStorage.setItem(key, "1");
    }
  }, []);

  const categories = ["All", ...Array.from(new Set(tasks.map(t => t.category)))];

  const filtered = tasks.filter(t => {
    if (filter.category !== "All" && t.category !== filter.category) return false;
    if (filter.priority !== "all" && t.priority !== filter.priority) return false;
    if (filter.status === "active" && t.completed) return false;
    if (filter.status === "done" && !t.completed) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length,
    soon: tasks.filter(t => !t.completed && isDueSoon(t.dueDate)).length,
  };

  const handleSave = async data => {
    try {
      const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) { setTasks(p => [json.data, ...p]); setShowForm(false); showNotif("Task added!", "success"); }
    } catch { showNotif("Failed to add task", "error"); }
  };

  const handleEditSave = async data => {
    try {
      const res = await fetch(`/api/tasks/${editTask._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) { setTasks(p => p.map(t => t._id === editTask._id ? json.data : t)); setEditTask(null); showNotif("Task updated!", "success"); }
    } catch { showNotif("Failed to update task", "error"); }
  };

  const handleToggle = task => {
    // optimistic UI update
    const newCompleted = !task.completed;
    setTasks(p => p.map(t => t._id === task._id ? { ...t, completed: newCompleted } : t));

    if (newCompleted) {
      // show undo toast, delay API call 6 seconds
      clearTimeout(undoTimerRef.current);
      if (pendingCompleteRef.current) { pendingCompleteRef.current(); } // flush any previous pending
      let cancelled = false;
      pendingCompleteRef.current = () => { cancelled = true; };
      setUndoEntry(task);
      undoTimerRef.current = setTimeout(async () => {
        if (cancelled) return;
        pendingCompleteRef.current = null;
        setUndoEntry(null);
        await fetch(`/api/tasks/${task._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: true }) });
      }, 6000);
    } else {
      // uncompleting — save immediately
      fetch(`/api/tasks/${task._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: false }) });
    }
  };

  const handleUndo = () => {
    clearTimeout(undoTimerRef.current);
    if (pendingCompleteRef.current) { pendingCompleteRef.current(); pendingCompleteRef.current = null; }
    if (undoEntry) setTasks(p => p.map(t => t._id === undoEntry._id ? { ...t, completed: false } : t));
    setUndoEntry(null);
  };

  const handleDelete = async id => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks(p => p.filter(t => t._id !== id));
      showNotif("Task deleted", "info");
    } catch { showNotif("Failed to delete task", "error"); }
  };

  const handleDailyReset = async () => {
    if (!confirm("Reset all daily tasks to incomplete?")) return;
    try {
      const res = await fetch("/api/tasks/daily-reset", { method: "POST" });
      const json = await res.json();
      if (json.success) { showNotif(`Reset ${json.reset} daily task(s)`, "success"); fetchTasks(); }
    } catch { showNotif("Reset failed", "error"); }
  };

  return (
    <>
      <Head><title>TaskMaster</title></Head>
      <div className="min-h-screen bg-[#0a0a0f] text-white">

        {/* notification toast */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
            notification.type === "success" ? "bg-green-600" : notification.type === "error" ? "bg-red-600" : "bg-gray-700"}`}>
            {notification.msg}
          </div>
        )}

        {/* undo toast */}
        {undoEntry && <UndoToast task={undoEntry} onUndo={handleUndo} onDismiss={() => setUndoEntry(null)} />}

        {/* pomodoro */}
        {pomodoroTask && <PomodoroTimer task={pomodoroTask} onClose={() => setPomodoroTask(null)} />}

        {/* modals */}
        {showBriefing && <DailyBriefingModal tasks={tasks} onClose={() => setShowBriefing(false)} />}
        {showReport && <WeeklyReportModal tasks={tasks} onClose={() => setShowReport(false)} />}

        {/* edit modal */}
        {editTask && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg bg-[#12121a] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-sm font-semibold text-white/70 mb-4">Edit task</h2>
              <TaskForm initial={editTask} categories={categories.filter(c => c !== "All").concat(["General"])} onSave={handleEditSave} onCancel={() => setEditTask(null)} />
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* header */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">TaskMaster</h1>
              <p className="text-white/40 text-sm mt-0.5">
                {stats.done}/{stats.total} done
                {stats.overdue > 0 && <span className="text-red-400 ml-2">· {stats.overdue} overdue</span>}
                {stats.soon > 0 && <span className="text-yellow-400 ml-2">· {stats.soon} due soon</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowBriefing(true)} className="px-3 py-2 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 rounded-lg transition-colors">☀️ Briefing</button>
              <button onClick={() => setShowReport(true)} className="px-3 py-2 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors">📊 Report</button>
              <button onClick={handleDailyReset} className="px-3 py-2 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors">↺ Reset</button>
              <button onClick={() => { setShowForm(true); setEditTask(null); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                Add task
              </button>
            </div>
          </div>

          {/* progress */}
          {stats.total > 0 && (
            <div className="mb-5">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(stats.done / stats.total) * 100}%` }} />
              </div>
            </div>
          )}

          {/* add form */}
          {showForm && !editTask && (
            <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white/70 mb-3">New task</h2>
              <TaskForm categories={categories.filter(c => c !== "All").concat(["General"])} onSave={handleSave} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {/* view toggle + filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
              <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-white/40 hover:text-white/70"}`}>≡ List</button>
              <button onClick={() => setView("matrix")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "matrix" ? "bg-blue-600 text-white" : "text-white/40 hover:text-white/70"}`}>⊞ Matrix</button>
            </div>
            <input className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-400"
              placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
              value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
            </select>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
              value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
              <option value="all" className="bg-gray-900">All priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p} className="bg-gray-900 capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
              value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="all" className="bg-gray-900">All</option>
              <option value="active" className="bg-gray-900">Active</option>
              <option value="done" className="bg-gray-900">Completed</option>
            </select>
          </div>

          {/* task list / matrix */}
          {loading ? (
            <div className="text-center py-16 text-white/30">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/20 text-lg">No tasks found</p>
              {tasks.length === 0 && <p className="text-white/10 text-sm mt-1">Add your first task above</p>}
            </div>
          ) : view === "matrix" ? (
            <MatrixView tasks={filtered} onToggle={handleToggle} onEdit={setEditTask} onDelete={handleDelete} onPomodoro={setPomodoroTask} />
          ) : (
            <ListView tasks={filtered} onToggle={handleToggle} onEdit={setEditTask} onDelete={handleDelete} onPomodoro={setPomodoroTask} />
          )}
        </div>
      </div>
    </>
  );
}
