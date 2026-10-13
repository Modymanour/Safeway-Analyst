import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, CircleCheck,
  CircleDot, Clock3, Command, Grid2X2, List, Loader2, MessageSquare, Pencil,
  Plus, RefreshCw, Search, Send, Shield, SlidersHorizontal, Tag, Trash2, X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  createIssue, createIssueCategory, createIssueComment, deleteIssue, deleteIssueComment,
  getIssueCategories, getIssueReporters, searchIssueComments, searchIssues, updateIssue, updateIssueComment,
} from "@/lib/api";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: "open", label: "Open", Icon: CircleDot, tone: "text-emerald-400" },
  { value: "planned", label: "Planned", Icon: Clock3, tone: "text-sky-400" },
  { value: "in_progress", label: "In progress", Icon: Circle, tone: "text-amber-400" },
  { value: "completed", label: "Completed", Icon: CircleCheck, tone: "text-violet-400" },
  { value: "closed", label: "Closed", Icon: Check, tone: "text-slate-400" },
];

const statusMeta = (status) => STATUS_OPTIONS.find((option) => option.value === status) || STATUS_OPTIONS[0];
const priorityLabel = (priority) => ({ 1: "Low", 2: "Below normal", 3: "Normal", 4: "High", 5: "Highest" }[priority] || "Normal");
const categoryColor = (color) => color?.startsWith("#") ? color : `#${color || "64748B"}`;
const shortId = (id) => id?.slice(0, 8) || "—";
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recently";

function StatusBadge({ status }) {
  const { Icon, label, tone } = statusMeta(status);
  return <span className={`inline-flex items-center gap-1.5 text-xs ${tone}`}><Icon className="h-3.5 w-3.5" />{label}</span>;
}

function CategoryBadge({ category }) {
  if (!category) return null;
  return <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground">
    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(category.color) }} />
    <span className="truncate">{category.name}</span>
  </span>;
}

function AnimatedSelect({ label, value, onChange, options, placeholder = "Choose…", disabled = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value);
  return <div ref={rootRef} className={`relative min-w-0 ${open ? "z-[70]" : "z-0"} ${className}`}>
    <button type="button" disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
    }} className="issue-select-trigger flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-sm transition duration-200 hover:border-primary/50 hover:bg-secondary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50">
      <span className="truncate">{selected?.label ?? placeholder}</span>
      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div role="listbox" aria-label={label} className="animate-dropdown-in absolute left-0 top-[calc(100%+8px)] z-[80] max-h-64 min-w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-2xl shadow-black/40">
      {options.map((option, index) => <button type="button" role="option" aria-selected={option.value === value} key={`${option.value}-${option.label}`} onClick={() => { onChange(option.value); setOpen(false); }} className={`animate-dropdown-option flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary focus-visible:bg-secondary ${option.value === value ? "bg-secondary/70 text-foreground" : "text-muted-foreground hover:text-foreground"}`} style={{ animationDelay: `${index * 25}ms` }}>
        <span className="flex min-w-0 items-center gap-2 truncate">{option.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(option.color) }} />}{option.label}</span>
        {option.value === value && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
      </button>)}
    </div>}
  </div>;
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-label={title} className={`animate-modal-in max-h-[92vh] w-full overflow-visible rounded-2xl border border-border bg-card shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur md:px-7">
        <h2 className="font-display text-xl">{title}</h2>
        <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      {children}
    </section>
  </div>;
}

function IssueForm({ categories, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState({ title: "", description: "", category_id: categories[0]?.id || "", priority: 3 });
  useEffect(() => {
    if (!form.category_id && categories[0]) setForm((current) => ({ ...current, category_id: categories[0].id }));
  }, [categories, form.category_id]);
  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, title: form.title.trim(), description: form.description.trim(), status: "open", priority: Number(form.priority) });
  };
  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name, color: category.color }));
  const priorityOptions = [1, 2, 3, 4, 5].map((priority) => ({
    value: priority,
    label: `${priority} · ${priorityLabel(priority)}`,
  }));

  return <form onSubmit={submit} className="space-y-5 p-5 md:p-7">
    <label className="block space-y-2 text-sm font-medium">Title
      <input required maxLength={200} autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="A concise summary of the issue" className="w-full rounded-xl border border-border bg-background px-3.5 py-3 outline-none transition focus:border-primary" />
    </label>
    <label className="block space-y-2 text-sm font-medium">Description
      <textarea required rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What should people know? Include steps, context, or the expected outcome." className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 outline-none transition focus:border-primary" />
    </label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block space-y-2 text-sm font-medium">Category
        <AnimatedSelect label="Issue category" value={form.category_id} onChange={(category_id) => setForm({ ...form, category_id })} options={categoryOptions} placeholder="Choose a category" disabled={!categories.length} />
      </label>
      <label className="block space-y-2 text-sm font-medium">Priority
        <AnimatedSelect label="Issue priority" value={Number(form.priority)} onChange={(priority) => setForm({ ...form, priority })} options={priorityOptions} />
      </label>
    </div>
    {!categories.length && <p role="alert" className="text-sm text-amber-300">Add a category before creating an issue.</p>}
    <div className="flex justify-end gap-2 border-t border-border pt-4">
      <button type="button" onClick={onCancel} className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-secondary">Cancel</button>
      <button type="submit" disabled={saving || !categories.length} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? "Creating…" : "Create issue"}</button>
    </div>
  </form>;
}

function CategoryForm({ saving, onCancel, onSubmit }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#D29922");
  const [description, setDescription] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    onSubmit({ slug, name: name.trim(), color: color.replace("#", ""), description: description.trim() });
  };
  return <form onSubmit={submit} className="space-y-5 p-5 md:p-7">
    <label className="block space-y-2 text-sm font-medium">Category name<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3" placeholder="Enhancement" /></label>
    <label className="block space-y-2 text-sm font-medium">Description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3" placeholder="What belongs in this category?" /></label>
    <label className="flex items-center gap-3 text-sm font-medium">Color<input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-10 w-16 cursor-pointer rounded border-0 bg-transparent" /><span className="font-mono text-xs text-muted-foreground">{color}</span></label>
    <div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onCancel} className="rounded-xl border border-border px-4 py-2.5 text-sm">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}Add category</button></div>
  </form>;
}

function IssueDetails({ issue, categories, user, onClose, onChanged, onError }) {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: issue.title, description: issue.description });
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === "admin";
  const canManageIssue = isAdmin || issue.created_by === user?.id;
  const category = categories.find((item) => item.id === issue.category_id);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const result = await searchIssueComments(issue.id);
      setComments(result?.data || []);
    } catch (cause) {
      onError(cause.message || "Could not load discussion.");
    } finally {
      setCommentsLoading(false);
    }
  }, [issue.id, onError]);
  useEffect(() => { loadComments(); }, [loadComments]);

  const saveIssue = async (changes) => {
    setSaving(true);
    try {
      const updated = await updateIssue(issue.id, changes);
      onChanged(updated);
      setEditing(false);
    } catch (cause) {
      onError(cause.message || "Could not update the issue.");
    } finally {
      setSaving(false);
    }
  };
  const postComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setCommentBusy(true);
    try {
      await createIssueComment(issue.id, commentText.trim());
      setCommentText("");
      await loadComments();
    } catch (cause) {
      onError(cause.message || "Could not add your comment.");
    } finally {
      setCommentBusy(false);
    }
  };
  const editComment = async (comment) => {
    const body = window.prompt("Edit your comment", comment.body);
    if (body == null || !body.trim() || body === comment.body) return;
    try {
      await updateIssueComment(comment.id, body.trim());
      await loadComments();
    } catch (cause) {
      onError(cause.message || "Could not update the comment.");
    }
  };
  const removeComment = async (comment) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteIssueComment(comment.id);
      await loadComments();
    } catch (cause) {
      onError(cause.message || "Could not delete the comment.");
    }
  };

  return <Modal title="Issue details" onClose={onClose} wide>
    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article className="min-w-0 p-5 md:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>#{shortId(issue.id)}</span><span>·</span><span>Opened {formatDate(issue.created_at)}</span><span>·</span><span>{issue.created_by === user?.id ? "by you" : `by ${shortId(issue.created_by)}`}</span></div>
        {editing ? <div className="space-y-3"><input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xl font-semibold" /><textarea rows={7} value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm" /><div className="flex justify-end gap-2"><button onClick={() => setEditing(false)} className="rounded-lg border border-border px-3 py-2 text-sm">Cancel</button><button disabled={saving} onClick={() => saveIssue(editForm)} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">{saving ? "Saving…" : "Save changes"}</button></div></div> : <>
          <div className="flex items-start justify-between gap-3"><h2 className="break-words font-display text-2xl leading-tight md:text-3xl">{issue.title}</h2>{canManageIssue && <button type="button" onClick={() => setEditing(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"><Pencil className="h-3.5 w-3.5" />Edit</button>}</div>
          <div className="prose prose-invert mt-5 max-w-none whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{issue.description}</div>
        </>}
        <div className="mt-8 border-t border-border pt-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><MessageSquare className="h-4 w-4 text-primary" />Discussion <span className="text-xs font-normal text-muted-foreground">{comments.length}</span></h3>
          {commentsLoading ? <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading discussion…</div> : comments.length ? <div className="space-y-3">
            {comments.map((comment) => {
              const canManageComment = isAdmin || comment.author_id === user?.id;
              return <div key={comment.id} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2 text-xs"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{comment.author_id === user?.id ? "Y" : "•"}</span><span className="truncate font-medium text-foreground">{comment.author_id === user?.id ? "You" : `Member ${shortId(comment.author_id)}`}</span><span className="shrink-0 text-muted-foreground">{formatDate(comment.created_at)}{comment.edited ? " · edited" : ""}</span></div>{canManageComment && <div className="flex shrink-0 gap-1"><button type="button" onClick={() => editComment(comment)} aria-label="Edit comment" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => removeComment(comment)} aria-label="Delete comment" className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>}</div>
                <p className="whitespace-pre-wrap break-words pl-9 text-sm leading-6 text-muted-foreground">{comment.body}</p>
              </div>;
            })}
          </div> : <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">No comments yet. Start the conversation.</p>}
          <form onSubmit={postComment} className="mt-4 flex items-end gap-2"><label className="sr-only" htmlFor="issue-comment">Add a comment</label><textarea id="issue-comment" rows={2} maxLength={5000} value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a comment…" className="min-h-11 flex-1 resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /><button disabled={commentBusy || !commentText.trim()} aria-label="Post comment" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">{commentBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></form>
        </div>
      </article>
      <aside className="border-t border-border bg-background/35 p-5 lg:border-l lg:border-t-0 lg:p-6">
        <div className="flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Details</h3>{canManageIssue && <button type="button" aria-label="Delete issue" onClick={async () => { if (window.confirm("Delete this issue and its discussion?")) { try { await deleteIssue(issue.id); onChanged(null); onClose(); } catch (cause) { onError(cause.message || "Could not delete the issue."); } } }} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}</div>
        <label className="mt-5 block space-y-2 text-xs font-medium text-muted-foreground">Status
          {canManageIssue ? <AnimatedSelect label="Issue status" value={issue.status} onChange={(status) => saveIssue({ status })} disabled={saving} options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))} /> : <span className="block py-1"><StatusBadge status={issue.status} /></span>}
        </label>
        <div className="mt-5 space-y-2"><p className="text-xs font-medium text-muted-foreground">Category</p><CategoryBadge category={category} /></div>
        <div className="mt-5 space-y-2"><p className="text-xs font-medium text-muted-foreground">Priority</p><p className="text-sm">{issue.priority} · {priorityLabel(issue.priority)} <span className="text-muted-foreground">/ 5</span></p></div>
        <div className="mt-5 space-y-2"><p className="text-xs font-medium text-muted-foreground">Reporter</p><p className="truncate text-sm">{issue.created_by === user?.id ? user?.username || "You" : `Member ${shortId(issue.created_by)}`}</p></div>
        <div className="mt-5 space-y-2"><p className="text-xs font-medium text-muted-foreground">Last updated</p><p className="text-sm">{formatDate(issue.updated_at)}</p></div>
      </aside>
    </div>
  </Modal>;
}

function IssueListRow({ issue, category, onOpen }) {
  const StatusIcon = statusMeta(issue.status).Icon;
  return <button type="button" onClick={onOpen} className="group grid w-full grid-cols-[24px_minmax(0,1fr)] gap-x-3 border-b border-border px-4 py-4 text-left transition hover:bg-secondary/30 sm:grid-cols-[24px_minmax(0,1fr)_145px_100px] sm:items-center sm:px-5">
    <StatusIcon className={`mt-1 h-4 w-4 ${statusMeta(issue.status).tone} sm:mt-0`} />
    <span className="min-w-0"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="truncate font-semibold text-foreground group-hover:text-primary">{issue.title}</span><CategoryBadge category={category} /></span><span className="mt-1 block truncate text-xs text-muted-foreground">#{shortId(issue.id)} opened {formatDate(issue.created_at)} by {shortId(issue.created_by)} · priority {issue.priority}/5</span></span>
    <span className="mt-2 sm:mt-0"><StatusBadge status={issue.status} /></span>
    <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground sm:mt-0"><MessageSquare className="h-3.5 w-3.5" />Open discussion</span>
  </button>;
}

function IssueTile({ issue, category, onOpen }) {
  const StatusIcon = statusMeta(issue.status).Icon;
  return <button type="button" onClick={onOpen} className="group flex min-h-[220px] flex-col rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-black/20">
    <div className="flex items-start justify-between gap-3"><span className={`rounded-xl bg-secondary p-2.5 ${statusMeta(issue.status).tone}`}><StatusIcon className="h-5 w-5" /></span><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="h-3.5 w-3.5" />Discuss</span></div>
    <h3 className="mt-5 line-clamp-2 font-display text-xl leading-snug text-foreground group-hover:text-primary">{issue.title}</h3>
    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{issue.description}</p>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4"><CategoryBadge category={category} /><span className="text-xs text-muted-foreground">P{issue.priority} · {formatDate(issue.created_at)}</span></div>
  </button>;
}

export default function IssuesPage() {
  const { user } = useAuth();
  const [view, setView] = useState(() => window.localStorage.getItem("safeway.issues.view") || "list");
  const [categories, setCategories] = useState([]);
  const [issuesResult, setIssuesResult] = useState({ data: [], total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ title: "", description: "", status: "", category_id: "", created_by: "", priority: "", start_date: "", end_date: "" });
  const [filters, setFilters] = useState({ title: null, description: null, status: null, category_id: null, created_by: null, priority: null, start_date: null, end_date: null });
  const [reporters, setReporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const result = await getIssueCategories();
      setCategories(result?.data || []);
    } catch (cause) {
      setError(cause.message || "Could not load issue categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);
  useEffect(() => { loadCategories(); }, [loadCategories, reloadKey]);

  useEffect(() => {
    let active = true;
    getIssueReporters().then((result) => {
      if (active) setReporters(result?.data || []);
    }).catch((cause) => {
      if (active) setError(cause.message || "Could not load issue reporters.");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await searchIssues({ ...filters, page, pageNumber: PAGE_SIZE });
        if (active) setIssuesResult(result || { data: [], total: 0, totalPages: 0 });
      } catch (cause) {
        if (active) setError(cause.message || "Could not load issues.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [filters, page, reloadKey]);

  const issues = issuesResult?.data || [];
  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const totalPages = Math.max(1, Number(issuesResult?.totalPages) || 1);
  const setViewMode = (mode) => { setView(mode); window.localStorage.setItem("safeway.issues.view", mode); };
  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters({
      title: draft.title.trim() || null,
      description: draft.description.trim() || null,
      status: draft.status || null,
      category_id: draft.category_id || null,
      created_by: draft.created_by || null,
      priority: draft.priority ? Number(draft.priority) : null,
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
    });
  };

  const createNewIssue = async (input) => {
    setBusy(true);
    setError("");
    try {
      await createIssue(input);
      setCreateOpen(false);
      setNotice("Issue created. It is now in the project backlog.");
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause.message || "Could not create the issue.");
    } finally {
      setBusy(false);
    }
  };
  const createCategory = async (input) => {
    setBusy(true);
    setError("");
    try {
      await createIssueCategory(input);
      setCategoryOpen(false);
      setNotice(`Category “${input.name}” created.`);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause.message || "Could not create the category.");
    } finally {
      setBusy(false);
    }
  };
  const refreshAfterIssueChange = (updated) => {
    if (!updated) {
      setSelectedIssue(null);
      setNotice("Issue deleted.");
      setReloadKey((key) => key + 1);
      return;
    }
    setSelectedIssue(updated);
    setIssuesResult((current) => ({ ...current, data: current.data.map((issue) => issue.id === updated.id ? updated : issue) }));
  };
  const surfaceError = useCallback((message) => setError(message), []);

  const statusFilterOptions = [{ value: "", label: "All statuses" }, ...STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))];
  const categoryFilterOptions = [{ value: "", label: "All categories" }, ...categories.map((category) => ({ value: category.id, label: category.name, color: category.color }))];
  const reporterOptions = [{ value: "", label: "All reporters" }, ...reporters.map((reporter) => ({ value: reporter.id, label: reporter.username || reporter.email }))];
  const priorityFilterOptions = [{ value: "", label: "Any priority" }, ...[1, 2, 3, 4, 5].map((priority) => ({ value: String(priority), label: `${priority} · ${priorityLabel(priority)}` }))];

  return <div className="issue-page-enter mx-auto max-w-[1440px] p-5 sm:p-6 md:p-8">
    <header className="issue-header-enter mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-primary"><Command className="h-3.5 w-3.5" />Project workspace</p><h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">Issues</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Track bugs, ideas, and work in one place. Open an issue to follow the conversation or update its status.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setCategoryOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary"><Tag className="h-4 w-4" />New category</button>
        <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110"><Plus className="h-4 w-4" />New issue</button>
      </div>
    </header>

    {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><div className="flex-1 text-muted-foreground">{error}</div><button type="button" onClick={() => { setError(""); setReloadKey((key) => key + 1); }} aria-label="Retry" className="rounded p-1 hover:bg-secondary"><RefreshCw className="h-4 w-4" /></button></div>}
    {notice && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice"><X className="h-4 w-4" /></button></div>}

    <section className="issue-board-enter overflow-visible rounded-2xl border border-border bg-card shadow-xl shadow-black/10">
      <form onSubmit={applyFilters} className="relative z-30 border-b border-border bg-background/40 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Search issues by title</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Search issues by title…" className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary" /></label>
          <AnimatedSelect label="Filter by status" value={draft.status} onChange={(status) => setDraft({ ...draft, status })} options={statusFilterOptions} className="w-full xl:w-40" />
          <AnimatedSelect label="Filter by category" value={draft.category_id} onChange={(category_id) => setDraft({ ...draft, category_id })} options={categoryFilterOptions} className="w-full xl:w-44" />
          <div className="flex gap-2">
            <button type="button" aria-expanded={advancedFiltersOpen} onClick={() => setAdvancedFiltersOpen((current) => !current)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition hover:bg-secondary ${advancedFiltersOpen ? "border-primary/50 bg-secondary text-foreground" : "border-border text-muted-foreground"}`}><SlidersHorizontal className="h-4 w-4" />More filters</button>
            <button type="submit" className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:border-primary/50 hover:bg-secondary">Filter</button>
          </div>
          <div className="flex w-fit items-center rounded-xl border border-border bg-card p-1 xl:ml-auto" aria-label="Issue layout" role="group">
          <button type="button" onClick={() => setViewMode("list")} aria-label="List view" aria-pressed={view === "list"} className={`rounded-lg p-2 ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><List className="h-4 w-4" /></button>
          <button type="button" onClick={() => setViewMode("grid")} aria-label="Square widget view" aria-pressed={view === "grid"} className={`rounded-lg p-2 ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><Grid2X2 className="h-4 w-4" /></button>
          </div>
        </div>
        {advancedFiltersOpen && <div className="animate-advanced-in mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Description contains<input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Search descriptions…" className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" /></label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Reported by<AnimatedSelect label="Filter by reporter" value={draft.created_by} onChange={(created_by) => setDraft({ ...draft, created_by })} options={reporterOptions} /></label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Priority<AnimatedSelect label="Filter by priority" value={draft.priority} onChange={(priority) => setDraft({ ...draft, priority })} options={priorityFilterOptions} /></label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Created after<input type="date" value={draft.start_date} onChange={(event) => setDraft({ ...draft, start_date: event.target.value })} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground [color-scheme:dark]" /></label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Created before<input type="date" value={draft.end_date} onChange={(event) => setDraft({ ...draft, end_date: event.target.value })} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground [color-scheme:dark]" /></label>
        </div>}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-xs text-muted-foreground sm:px-5"><div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary" /><span><strong className="text-foreground">{Number(issuesResult?.total) || 0}</strong> issues</span><span>·</span><span>{filters.status ? statusMeta(filters.status).label : "All statuses"}</span></div>{categoriesLoading && <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading categories</span>}</div>

      {loading && !issues.length ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" />Loading issues…</div> : issues.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Command className="h-7 w-7" /></span><h2 className="mt-4 font-display text-xl">Nothing on the board yet</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Try changing the filters or create the first issue for your team.</p><button type="button" onClick={() => setCreateOpen(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Create an issue</button></div> : view === "list" ? <div>
        <div className="hidden grid-cols-[24px_minmax(0,1fr)_145px_100px] gap-3 border-b border-border bg-background/25 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:grid"><span /><span>Issue</span><span>Status</span><span>Activity</span></div>
        {issues.map((issue, index) => <div key={issue.id} className="issue-row-enter" style={{ "--issue-index": index }}><IssueListRow issue={issue} category={categoriesById.get(issue.category_id)} onOpen={() => setSelectedIssue(issue)} /></div>)}
      </div> : <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{issues.map((issue, index) => <div key={issue.id} className="issue-tile-enter" style={{ "--issue-index": index }}><IssueTile issue={issue} category={categoriesById.get(issue.category_id)} onOpen={() => setSelectedIssue(issue)} /></div>)}</div>}

      <footer className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-5"><span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} aria-label="Previous page" className="rounded-lg border border-border p-2 hover:bg-secondary disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading} aria-label="Next page" className="rounded-lg border border-border p-2 hover:bg-secondary disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer>
    </section>
    {loading && issues.length > 0 && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Updating issue results…</p>}

    {createOpen && <Modal title="Open a new issue" onClose={() => setCreateOpen(false)}><IssueForm categories={categories} saving={busy} onCancel={() => setCreateOpen(false)} onSubmit={createNewIssue} /></Modal>}
    {categoryOpen && <Modal title="Add a category" onClose={() => setCategoryOpen(false)}><CategoryForm saving={busy} onCancel={() => setCategoryOpen(false)} onSubmit={createCategory} /></Modal>}
    {selectedIssue && <IssueDetails key={selectedIssue.id} issue={selectedIssue} categories={categories} user={user} onClose={() => setSelectedIssue(null)} onChanged={refreshAfterIssueChange} onError={surfaceError} />}
  </div>;
}
