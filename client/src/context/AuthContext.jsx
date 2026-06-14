import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser]       = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate              = useNavigate()

    // Load user from localStorage on app start
    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    //Signup 
    const signup = async (username, email, password, password2) => {
        await api.post('/users/signup/', { username, email, password, password2 })
        navigate('/login')
    }

    //Login
    const login = async (email, password) => {
        const res = await api.post('/users/login/', { email, password })

        const { access_token, refresh_token, user } = res.data

        localStorage.setItem('access_token',  access_token)
        localStorage.setItem('refresh_token', refresh_token)
        localStorage.setItem('user',          JSON.stringify(user))

        setUser(user)
        navigate('/tasks')
    }

    //Logout
    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setUser(null)
        navigate('/login')
    }

    //Token Refresh
    const refreshToken = async () => {
        try {
            const refresh = localStorage.getItem('refresh_token')
            if (!refresh) throw new Error('No refresh token')

            const res = await api.post('/users/token/refresh/', { refresh })
            localStorage.setItem('access_token', res.data.access)
            return res.data.access
        } catch {
            logout()
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshToken }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)