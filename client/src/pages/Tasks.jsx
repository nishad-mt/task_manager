import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import styles from '../styles/Tasks.module.css'

const EMPTY_FORM = {
    title:       '',
    description: '',
    due_date:    '',
    priority:    'MEDIUM',
    status:      'TODO',
}

const PRIORITY_BADGE = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' }
const STATUS_BADGE   = { TODO: 'todo', IN_PROGRESS: 'inprogress', DONE: 'done' }

export default function Tasks() {
    const { user, logout }            = useAuth()
    const [tasks, setTasks]           = useState([])
    const [loading, setLoading]       = useState(true)
    const [error, setError]           = useState('')
    const [formErrors, setFormErrors] = useState({})
    const [showModal, setShowModal]   = useState(false)
    const [editTask, setEditTask]     = useState(null)
    const [formData, setFormData]     = useState(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [filterStatus,   setFilterStatus]   = useState('')
    const [filterPriority, setFilterPriority] = useState('')
    const [search, setSearch]         = useState('')
    // searchQuery is what was last submitted — separates typing from fetching
    const [searchQuery, setSearchQuery] = useState('')

    const [count, setCount]       = useState(0)
    const [nextPage, setNextPage] = useState(null)
    const [prevPage, setPrevPage] = useState(null)
    const [page, setPage]         = useState(1)

    // ── Stats (server-side counts, not page-slice counts) ─────────────────
    // We keep separate counters returned from the API per-status so the
    // summary always reflects the full dataset, not just the current page.
    const [statusCounts, setStatusCounts] = useState({ TODO: 0, IN_PROGRESS: 0, DONE: 0 })

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchTasks = async () => {
        setLoading(true)
        setError('')
        try {
            const params = { page }
            if (filterStatus)   params.status   = filterStatus
            if (filterPriority) params.priority = filterPriority
            if (searchQuery)    params.search   = searchQuery

            const res = await api.get('/tasks/', { params })

            setTasks(res.data.results)
            setCount(res.data.count)
            setNextPage(res.data.next)
            setPrevPage(res.data.previous)
        } catch {
            setError('Failed to load tasks.')
        } finally {
            setLoading(false)
        }
    }

    // Fetch full status breakdown (no filter, no pagination) for the stats row.
    // This gives accurate totals regardless of active filters / page.
    const fetchStatusCounts = async () => {
        try {
            const [todoRes, inProgressRes, doneRes] = await Promise.all([
                api.get('/tasks/', { params: { status: 'TODO',        page_size: 1 } }),
                api.get('/tasks/', { params: { status: 'IN_PROGRESS', page_size: 1 } }),
                api.get('/tasks/', { params: { status: 'DONE',        page_size: 1 } }),
            ])
            setStatusCounts({
                TODO:        todoRes.data.count,
                IN_PROGRESS: inProgressRes.data.count,
                DONE:        doneRes.data.count,
            })
        } catch {
            // stats are non-critical; fail silently
        }
    }

    // Re-fetch tasks whenever page, filters, or committed search query change.
    useEffect(() => {
        fetchTasks()
    }, [page, filterStatus, filterPriority, searchQuery])

    // Re-fetch stats on mount and after any mutation (tracked via `count`
    // which changes on create / delete).  We also refresh on filter change so
    // the total reflects any server-side data changes in the meantime.
    useEffect(() => {
        fetchStatusCounts()
    }, [count])

    // Reset to page 1 whenever filters change so we never land on a
    // non-existent page after narrowing results.
    const handleFilterStatus = (val) => {
        setFilterStatus(val)
        setPage(1)
    }

    const handleFilterPriority = (val) => {
        setFilterPriority(val)
        setPage(1)
    }

    // Commit the search only when the form is submitted.
    const handleSearch = (e) => {
        e.preventDefault()
        setPage(1)
        setSearchQuery(search)   // ← triggers the useEffect above
    }

    // Clear search
    const handleClearSearch = () => {
        setSearch('')
        setSearchQuery('')
        setPage(1)
    }

    // ── Modal ─────────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditTask(null)
        setFormData(EMPTY_FORM)
        setFormErrors({})        // ← reset validation errors on open
        setError('')
        setShowModal(true)
    }

    const openEdit = (task) => {
        setEditTask(task)
        setFormData({
            title:       task.title,
            description: task.description,
            due_date:    task.due_date,
            priority:    task.priority,
            status:      task.status,
        })
        setFormErrors({})        // ← reset validation errors on open
        setError('')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditTask(null)
        setFormData(EMPTY_FORM)
        setFormErrors({})
        setError('')
    }

    // ── Form ──────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setFormErrors({})
        setError('')
        try {
            if (editTask) {
                const res = await api.put(`/tasks/${editTask.id}/`, formData)
                setTasks(tasks.map(t => t.id === editTask.id ? res.data : t))
            } else {
                const res = await api.post('/tasks/', formData)
                setTasks([res.data, ...tasks])
                setCount(prev => prev + 1)   // triggers stats refresh
            }
            closeModal()
        } catch (err) {
            setFormErrors(err.response?.data || {})
        } finally {
            setSubmitting(false)
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return
        try {
            await api.delete(`/tasks/${id}/`)
            setTasks(tasks.filter(t => t.id !== id))
            setCount(prev => prev - 1)       // triggers stats refresh
        } catch {
            setError('Failed to delete task.')
        }
    }

    // ── Quick Status ──────────────────────────────────────────────────────
    const handleStatusChange = async (task, newStatus) => {
        try {
            const res = await api.patch(`/tasks/${task.id}/`, { status: newStatus })
            setTasks(tasks.map(t => t.id === task.id ? res.data : t))
            // Trigger a stats refresh by bumping count (value itself unchanged
            // but the effect dependency sees a new reference via the setter).
            fetchStatusCounts()
        } catch {
            setError('Failed to update status.')
        }
    }

    // ── Derived stats ─────────────────────────────────────────────────────
    const totalCount    = statusCounts.TODO + statusCounts.IN_PROGRESS + statusCounts.DONE
    const todoCount     = statusCounts.TODO
    const inProgCount   = statusCounts.IN_PROGRESS
    const doneCount     = statusCounts.DONE

    return (
        <div className={styles.page}>

            {/* ── Navbar ── */}
            <nav className={styles.navbar}>
                <h1 className={styles.logo}>TaskManager</h1>
                <div className={styles.navRight}>
                    <span className={styles.welcome}>Hi, {user?.username}</span>
                    <button onClick={logout} className={styles.logoutBtn}>Logout</button>
                </div>
            </nav>

            <div className={styles.content}>

                {/* ── Stats ── */}
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <span className={styles.statNum}>{totalCount}</span>
                        <span className={styles.statLabel}>Total</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statNum} ${styles.todoColor}`}>{todoCount}</span>
                        <span className={styles.statLabel}>To Do</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statNum} ${styles.inprogressColor}`}>{inProgCount}</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statNum} ${styles.doneColor}`}>{doneCount}</span>
                        <span className={styles.statLabel}>Done</span>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className={styles.toolbar}>
                    {/* Search */}
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button type="submit">Search</button>
                        {searchQuery && (
                            <button type="button" onClick={handleClearSearch}>
                                Clear
                            </button>
                        )}
                    </form>

                    {/* Filters */}
                    <div className={styles.filters}>
                        <select value={filterStatus} onChange={e => handleFilterStatus(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>

                        <select value={filterPriority} onChange={e => handleFilterPriority(e.target.value)}>
                            <option value="">All Priority</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>

                    {/* Create Button */}
                    <button onClick={openCreate} className={styles.createBtn}>
                        + New Task
                    </button>
                </div>

                {/* ── Error ── */}
                {error && <div className={styles.error}>{error}</div>}

                {/* ── Table ── */}
                {loading ? (
                    <div className={styles.loading}>Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No tasks found.</p>
                        <button onClick={openCreate}>+ Create your first task</button>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Due Date</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task, index) => (
                                    <tr key={task.id}>
                                        <td className={styles.indexCol}>
                                            {(page - 1) * 5 + index + 1}
                                        </td>

                                        <td className={styles.titleCol}>
                                            <span className={task.status === 'DONE' ? styles.strikethrough : ''}>
                                                {task.title}
                                            </span>
                                        </td>

                                        <td className={styles.descCol}>
                                            {task.description || <span className={styles.noDesc}>—</span>}
                                        </td>

                                        <td className={styles.dateCol}>
                                            📅 {task.due_date}
                                        </td>

                                        <td>
                                            <span className={`${styles.badge} ${styles[PRIORITY_BADGE[task.priority]]}`}>
                                                {task.priority}
                                            </span>
                                        </td>

                                        <td>
                                            <select
                                                className={`${styles.statusSelect} ${styles[STATUS_BADGE[task.status]]}`}
                                                value={task.status}
                                                onChange={e => handleStatusChange(task, e.target.value)}
                                            >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                        </td>

                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    onClick={() => openEdit(task)}
                                                    className={styles.editBtn}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className={styles.deleteBtn}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className={styles.pagination}>
                            <button
                                disabled={!prevPage}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </button>
                            <span>Page {page}</span>
                            <button
                                disabled={!nextPage}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{editTask ? 'Edit Task' : 'New Task'}</h3>
                            <button onClick={closeModal} className={styles.closeBtn}>✕</button>
                        </div>

                        {Object.keys(formErrors).length > 0 && (
                            <div className={styles.modalError}>
                                {Object.values(formErrors)[0][0]}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Task title"
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Priority</label>
                                    <select name="priority" value={formData.priority} onChange={handleChange}>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={closeModal} className={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                                    {submitting ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}