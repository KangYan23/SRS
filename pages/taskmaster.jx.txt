import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_COLORS = {
  low: "bg-green-500/20 text-green-300 border-green-500/40",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  high: "bg-red-500/20 text-red-300 border-red-500/40",
};

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function isDueSoon(dueDate, hours = 24) {
  if (!dueDate) return false;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  return diff > 0 && diff < hours * 60 * 60 * 1000;
}

function TaskForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: categories[0] || "General",
    priority: "medium",
    dueDate: "",
    dailyReset: false,
    ...initial,
    dueDate: initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 16) : "",
  });
  const [newCat, setNewCat] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const cat = newCat.trim() || form.category;
    onSave({ ...form, category: cat, dueDate: form.dueDate || null });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-400"
        placeholder="Task title *"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        required
      />
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-400 resize-none"
        placeholder="Description (optional)"
        rows={2}
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Category</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-gray-900">
                {c}
              </option>
            ))}
            <option value="__new__" className="bg-gray-900">+ New category…</option>
          </select>
          {form.category === "__new__" && (
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-400"
              placeholder="Category name"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
          )}
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Priority</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            value={form.priority}
            onChange={(e) => set("priority", e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} className="bg-gray-900 capitalize">
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Due date & time</label>
        <input
          type="datetime-local"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
          value={form.dueDate}
          onChange={(e) => set("dueDate", e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="rounded accent-blue-400"
          checked={form.dailyReset}
          onChange={(e) => set("dailyReset", e.target.checked)}
        />
        <span className="text-sm text-white/70">Daily recurring task (resets each day)</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 font-medium transition-colors"
        >
          {initial ? "Save changes" : "Add task"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg py-2 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const overdue = !task.completed && isOverdue(task.dueDate);
  const soon = !task.completed && isDueSoon(task.dueDate);

  return (
    <div
      className={`group relative bg-white/5 border rounded-xl p-4 transition-all ${
        task.completed
          ? "border-white/5 opacity-60"
          : overdue
          ? "border-red-500/40"
          : soon
          ? "border-yellow-500/40"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? "bg-blue-500 border-blue-500"
              : "border-white/30 hover:border-blue-400"
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm ${task.completed ? "line-through text-white/40" : "text-white"}`}>
              {task.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            {task.dailyReset && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                daily
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-white/50 mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{task.category}</span>
            {task.dueDate && (
              <span className={`text-xs ${overdue ? "text-red-400" : soon ? "text-yellow-400" : "text-white/40"}`}>
                {overdue ? "Overdue · " : soon ? "Due soon · " : "Due "}
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaskMaster() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState({ category: "All", priority: "all", status: "all" });
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);
  const notifRef = useRef(null);

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
    } catch {
      showNotif("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotif]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!("Notification" in window)) return;
    Notification.requestPermission();

    const check = () => {
      tasks.forEach((t) => {
        if (!t.completed && isDueSoon(t.dueDate, 1)) {
          if (Notification.permission === "granted") {
            new Notification("Task due soon", { body: t.title, icon: "/icons/icon-192.png" });
          }
        }
      });
    };

    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const categories = ["All", ...Array.from(new Set(tasks.map((t) => t.category)))];

  const filtered = tasks.filter((t) => {
    if (filter.category !== "All" && t.category !== filter.category) return false;
    if (filter.priority !== "all" && t.priority !== filter.priority) return false;
    if (filter.status === "active" && t.completed) return false;
    if (filter.status === "done" && !t.completed) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, t) => {
    const key = t.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
    overdue: tasks.filter((t) => !t.completed && isOverdue(t.dueDate)).length,
    soon: tasks.filter((t) => !t.completed && isDueSoon(t.dueDate)).length,
  };

  const handleSave = async (data) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => [json.data, ...prev]);
        setShowForm(false);
        showNotif("Task added!", "success");
      }
    } catch {
      showNotif("Failed to add task", "error");
    }
  };

  const handleEdit = async (data) => {
    try {
      const res = await fetch(`/api/tasks/${editTask._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.map((t) => (t._id === editTask._id ? json.data : t)));
        setEditTask(null);
        showNotif("Task updated!", "success");
      }
    } catch {
      showNotif("Failed to update task", "error");
    }
  };

  const handleToggle = async (task) => {
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.map((t) => (t._id === task._id ? json.data : t)));
      }
    } catch {
      showNotif("Failed to update task", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t._id !== id));
      showNotif("Task deleted", "info");
    } catch {
      showNotif("Failed to delete task", "error");
    }
  };

  const handleDailyReset = async () => {
    if (!confirm("Reset all daily tasks to incomplete?")) return;
    try {
      const res = await fetch("/api/tasks/daily-reset", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showNotif(`Reset ${json.reset} daily task(s)`, "success");
        fetchTasks();
      }
    } catch {
      showNotif("Reset failed", "error");
    }
  };

  return (
    <>
      <Head>
        <title>TaskMaster</title>
      </Head>
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
              notification.type === "success"
                ? "bg-green-600 text-white"
                : notification.type === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-700 text-white"
            }`}
          >
            {notification.msg}
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">TaskMaster</h1>
              <p className="text-white/40 text-sm mt-0.5">
                {stats.done}/{stats.total} done
                {stats.overdue > 0 && <span className="text-red-400 ml-2">· {stats.overdue} overdue</span>}
                {stats.soon > 0 && <span className="text-yellow-400 ml-2">· {stats.soon} due soon</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDailyReset}
                className="px-3 py-2 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
              >
                Daily reset
              </button>
              <button
                onClick={() => { setShowForm(true); setEditTask(null); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add task
              </button>
            </div>
          </div>

          {stats.total > 0 && (
            <div className="mb-6">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.done / stats.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {showForm && !editTask && (
            <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white/70 mb-3">New task</h2>
              <TaskForm
                categories={categories.filter((c) => c !== "All").concat(["General"])}
                onSave={handleSave}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            <input
              className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-400"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
              value={filter.category}
              onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-gray-900">{c}</option>
              ))}
            </select>
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
              value={filter.priority}
              onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}
            >
              <option value="all" className="bg-gray-900">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-gray-900 capitalize">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="all" className="bg-gray-900">All</option>
              <option value="active" className="bg-gray-900">Active</option>
              <option value="done" className="bg-gray-900">Completed</option>
            </select>
          </div>

          {editTask && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <div className="w-full max-w-lg bg-[#12121a] border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-sm font-semibold text-white/70 mb-4">Edit task</h2>
                <TaskForm
                  initial={editTask}
                  categories={categories.filter((c) => c !== "All").concat(["General"])}
                  onSave={handleEdit}
                  onCancel={() => setEditTask(null)}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-white/30">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/20 text-lg">No tasks found</p>
              {tasks.length === 0 && (
                <p className="text-white/10 text-sm mt-1">Add your first task above</p>
              )}
            </div>
          ) : filter.category === "All" ? (
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, catTasks]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">{cat}</h3>
                    <span className="text-xs text-white/25">{catTasks.filter((t) => !t.completed).length} left</span>
                  </div>
                  <div className="space-y-2">
                    {catTasks.map((t) => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onToggle={handleToggle}
                        onEdit={setEditTask}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  onToggle={handleToggle}
                  onEdit={setEditTask}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}