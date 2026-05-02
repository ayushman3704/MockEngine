import axios  from "axios";

const axiosInstance = axios.create({
    baseURL: 'https://mockengine-1.onrender.com',

    withCredentials: true
});

export default axiosInstance;
