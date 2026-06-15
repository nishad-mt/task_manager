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
            setUser(JSON.parse(storedUser)) //localStorage stores only strings.React state expects an object
        }
        setLoading(false) //Whether a user was found or not, we're done checking localStorage.
    }, []) //Run once on component mount

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
        localStorage.clear()
        setUser(null)
        navigate('/login')
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)