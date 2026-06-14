import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/Signup.module.css'

export default function Signup() {
    const { signup } = useAuth()
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', password2: ''
    })
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.password2) {
            return setError('Passwords do not match.')
        }

        setLoading(true)
        try {
            await signup(formData.username, formData.email, formData.password, formData.password2)
        } catch (err) {
            const errors = err.response?.data
            const first  = errors ? Object.values(errors)[0][0] : 'Signup failed.'
            setError(first)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>Create Account</h2>
                <p className={styles.subtitle}>Start managing your tasks today</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="johndoe"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.btn}
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p className={styles.link}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    )
}