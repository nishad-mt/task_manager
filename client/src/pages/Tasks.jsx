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
    const [showModal, setShowModal]   = useState(false)
    const [editTask, setEditTask]     = useState(null)
    const [formData, setFormData]     = useState(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [filterStatus,   setFilterStatus]   = useState('')
    const [filterPriority, setFilterPriority] = useState('')
    const [search, setSearch]         = useState('')

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchTasks = async () => {
        setLoading(true)
        setError('')
        try {
            const params = {}
            if (filterStatus)   params.status   = filterStatus
            if (filterPriority) params.priority = filterPriority
            if (search)         params.search   = search
            const res = await api.get('/tasks/', { params })
            setTasks(res.data)
        } catch {
            setError('Failed to load tasks.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchTasks() }, [filterStatus, filterPriority])

    const handleSearch = (e) => {
        e.preventDefault()
        fetchTasks()
    }

    // ── Modal ─────────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditTask(null)
        setFormData(EMPTY_FORM)
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
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditTask(null)
        setFormData(EMPTY_FORM)
        setError('')
    }

    // ── Form ──────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        try {
            if (editTask) {
                const res = await api.put(`/tasks/${editTask.id}/`, formData)
                setTasks(tasks.map(t => t.id === editTask.id ? res.data : t))
            } else {
                const res = await api.post('/tasks/', formData)
                setTasks([res.data, ...tasks])
            }
            closeModal()
        } catch (err) {
            const errors = err.response?.data
            const first  = errors ? Object.values(errors)[0] : 'Failed to save task.'
            setError(Array.isArray(first) ? first[0] : first)
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
        } catch {
            setError('Failed to delete task.')
        }
    }

    // ── Quick Status ──────────────────────────────────────────────────────
    const handleStatusChange = async (task, newStatus) => {
        try {
            const res = await api.patch(`/tasks/${task.id}/`, { status: newStatus })
            setTasks(tasks.map(t => t.id === task.id ? res.data : t))
        } catch {
            setError('Failed to update status.')
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────
    const stats = {
        total:      tasks.length,
        todo:       tasks.filter(t => t.status === 'TODO').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        done:       tasks.filter(t => t.status === 'DONE').length,
    }

    return (
        <div className={styles.page}>

            {/* ── Navbar ── */}
            <nav className={styles.navbar}>
                <h1 className={styles.logo}>TaskManager</h1>
                <div className={styles.navRight}>
                    <span className={styles.welcome}>Hi, {user?.username} 👋</span>
                    <button onClick={logout} className={styles.logoutBtn}>Logout</button>
                </div>
            </nav>

            <div className={styles.content}>

                {/* ── Stats ── */}
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <span className={styles.statNum}>{stats.total}</span>
                        <span className={styles.statLabel}>Total</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statNum} ${styles.todoColor}`}>{stats.todo}</span>
                        <span className={styles.statLabel}>To Do</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statNum} ${styles.inprogressColor}`}>{stats.inProgress}</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statNum} ${styles.doneColor}`}>{stats.done}</span>
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
                    </form>

                    {/* Filters */}
                    <div className={styles.filters}>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>

                        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
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
                                        <td className={styles.indexCol}>{index + 1}</td>

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

                        {error && <div className={styles.modalError}>{error}</div>}

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