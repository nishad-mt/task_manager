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
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config //Stores the request that failed.

        if (error.response?.status == 401 && !original._retry){ //Token expired? Have we not retried already?
            original._retry = true //Prevent Infinite Loop

             try {
                const refresh  = localStorage.getItem('refresh_token') //Stored during login.
                const res      = await axios.post('http://localhost:8000/api/users/token/refresh/', { refresh }) //Request New Access Token
                const newToken = res.data.access

                localStorage.setItem('access_token', newToken)
                original.headers.Authorization = `Bearer ${newToken}` //Update Failed Request,Now the old request uses the new token

                return api(original)  // retry original request
            } catch {
                localStorage.clear()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error) //Passes the error to the component that made the request.
    }
)

export default api
