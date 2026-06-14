import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import styles from '../styles/Tasks.module.css'

const PRIORITY_COLORS = {
    LOW:    'low',
    MEDIUM: 'medium',
    HIGH:   'high',
}

const STATUS_COLORS = {
    TODO:        'todo',
    IN_PROGRESS: 'inprogress',
    DONE:        'done',
}

const EMPTY_FORM = {
    title:       '',
    description: '',
    due_date:    '',
    priority:    'MEDIUM',
    status:      'TODO',
}

export default function Tasks() {
    const { user, logout }        = useAuth()
    const [tasks, setTasks]       = useState([])
    const [loading, setLoading]   = useState(true)
    const [error, setError]       = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editTask, setEditTask]   = useState(null)
    const [formData, setFormData]   = useState(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [filterStatus,   setFilterStatus]   = useState('')
    const [filterPriority, setFilterPriority] = useState('')

    // ── Fetch Tasks ───────────────────────────────────────────────────────
    const fetchTasks = async () => {
        setLoading(true)
        try {
            const params = {}
            if (filterStatus)   params.status   = filterStatus
            if (filterPriority) params.priority = filterPriority

            const res = await api.get('/tasks/', { params })
            setTasks(res.data)
        } catch {
            setError('Failed to load tasks.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchTasks() }, [filterStatus, filterPriority])

    // ── Open Modal ────────────────────────────────────────────────────────
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
    }

    // ── Handle Form ───────────────────────────────────────────────────────
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editTask) {
                await api.put(`/tasks/${editTask.id}/`, formData)
            } else {
                await api.post('/tasks/', formData)
            }
            closeModal()
            fetchTasks()
        } catch (err) {
            setError('Failed to save task.')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Delete Task ───────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return
        try {
            await api.delete(`/tasks/${id}/`)
            setTasks(tasks.filter(t => t.id !== id))
        } catch {
            setError('Failed to delete task.')
        }
    }

    // ── Quick Status Toggle ───────────────────────────────────────────────
    const handleStatusChange = async (task, newStatus) => {
        try {
            await api.patch(`/tasks/${task.id}/`, { status: newStatus })
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
        } catch {
            setError('Failed to update status.')
        }
    }

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

            {/* ── Header ── */}
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>My Tasks</h2>
                    <p className={styles.subtitle}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
                </div>
                <button onClick={openCreate} className={styles.createBtn}>
                    + New Task
                </button>
            </div>

            {/* ── Filters ── */}
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

            {/* ── Error ── */}
            {error && <div className={styles.error}>{error}</div>}

            {/* ── Task List ── */}
            {loading ? (
                <div className={styles.loading}>Loading tasks...</div>
            ) : tasks.length === 0 ? (
                <div className={styles.empty}>
                    <p>No tasks found.</p>
                    <button onClick={openCreate}>Create your first task</button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {tasks.map(task => (
                        <div key={task.id} className={styles.card}>

                            {/* Card Header */}
                            <div className={styles.cardHeader}>
                                <span className={`${styles.priority} ${styles[PRIORITY_COLORS[task.priority]]}`}>
                                    {task.priority}
                                </span>
                                <span className={`${styles.status} ${styles[STATUS_COLORS[task.status]]}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Card Body */}
                            <h3 className={styles.taskTitle}>{task.title}</h3>
                            {task.description && (
                                <p className={styles.taskDesc}>{task.description}</p>
                            )}
                            <p className={styles.dueDate}>📅 Due: {task.due_date}</p>

                            {/* Quick Status Change */}
                            <select
                                className={styles.statusSelect}
                                value={task.status}
                                onChange={e => handleStatusChange(task, e.target.value)}
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>

                            {/* Card Actions */}
                            <div className={styles.cardActions}>
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
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal ── */}
            {showModal && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{editTask ? 'Edit Task' : 'New Task'}</h3>
                            <button onClick={closeModal} className={styles.closeBtn}>✕</button>
                        </div>

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