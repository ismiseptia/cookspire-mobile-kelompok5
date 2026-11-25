import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.18.20:5000/api';
export const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dipanggil saat server menolak token (kedaluwarsa/tidak valid) agar app kembali ke halaman Login.
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// Sisipkan JWT ke setiap request secara otomatis
API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Gagal membaca token:', error.message);
  }
  return config;
});

// Token kedaluwarsa / tidak valid -> bersihkan sesi lalu arahkan ke Login
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    if (status === 401 && (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID')) {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      if (unauthorizedHandler) unauthorizedHandler(error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export const resolveImageUrl = (uri) => {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('data:image')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${SERVER_URL}${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${SERVER_URL}/${trimmed}`;
  }

  return null;
};

export const uploadImageAsset = async (assetUri, base64Data = null, prefix = 'img') => {
  if (!assetUri && !base64Data) return null;

  if (
    typeof assetUri === 'string' &&
    (assetUri.startsWith('/uploads/') ||
      assetUri.startsWith('http://') ||
      assetUri.startsWith('https://'))
  ) {
    return assetUri;
  }

  let imagePayload = null;
  if (base64Data) {
    imagePayload = base64Data.startsWith('data:image')
      ? base64Data
      : `data:image/jpeg;base64,${base64Data}`;
  } else if (typeof assetUri === 'string' && assetUri.startsWith('data:image')) {
    imagePayload = assetUri;
  }

  if (!imagePayload) {
    return typeof assetUri === 'string' ? assetUri : null;
  }

  const res = await API.post('/upload', {
    image: imagePayload,
    prefix,
  });

  if (res.data?.success && res.data?.url) {
    return res.data.url;
  }

  throw new Error(res.data?.message || 'Gagal mengunggah gambar ke server.');
};

export default API;