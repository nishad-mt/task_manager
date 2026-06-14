import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8000/api'
})

// Attach access token to every request
api.interceptors.request.use((config)=>{
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config //Without this: won't know what request to send.
})

// Auto refresh token if access token expired
api.interceptors.request.use(
    (response) => response,
    async (error) => {
        const original = error.config

        if (error.response?.status == 401 && !original._retry){
            original._retry = true

             try {
                const refresh  = localStorage.getItem('refresh_token')
                const res      = await axios.post('http://localhost:8000/api/users/token/refresh/', { refresh })
                const newToken = res.data.access

                localStorage.setItem('access_token', newToken)
                original.headers.Authorization = `Bearer ${newToken}`

                return api(original)  // retry original request
            } catch {
                localStorage.clear()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api
