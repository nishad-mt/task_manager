import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login  from './pages/Login'
import Signup from './pages/Signup'
import Tasks  from './pages/Tasks'

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return <div className="loading">Loading...</div>
    return user ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return <div className="loading">Loading...</div>
    return !user ? children : <Navigate to="/tasks" />
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/tasks" />} />

            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />

            <Route path="/signup" element={
                <PublicRoute>
                    <Signup />
                </PublicRoute>
            } />

            <Route path="/tasks" element={
                <PrivateRoute>
                    <Tasks />
                </PrivateRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}