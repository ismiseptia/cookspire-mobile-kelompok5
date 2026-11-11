import axios from 'axios';

// Ganti IP_LAPTOP_KAMU dengan IPv4 hasil ipconfig di Langkah 2
const API_URL = 'http://20.5.31.229:5000/api'; 

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;