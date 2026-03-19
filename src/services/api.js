import axios from 'axios';

import { getToken } from '../utils/authStorage';

export const api = axios.create({
  baseURL: 'http://206.19.38.15:8002/MobiHISTreeCoreSit/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    
  },
});

api.interceptors.request.use(async config => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractToken(payload) {
  if (!payload) return null;

  // Common shapes across APIs
  return (
    payload.token ||
    payload.jwt ||
    payload.accessToken ||
    payload.access_token ||
    payload?.result?.token ||
    payload?.result?.jwt ||
    payload?.result?.accessToken ||
    payload?.result?.access_token ||
    payload?.data?.token ||
    payload?.data?.jwt ||
    payload?.data?.accessToken ||
    payload?.data?.access_token ||
    null
  );
}

export async function login({ userName, password }) {
  const res = await api.post('/Auth/Login', { userName, password });
  const token = extractToken(res?.data);
  console.log('LOGIN API:', res?.data);
  if (!token) {
    throw new Error('Login succeeded but token was not returned by API.');
  }
  return { token, raw: res?.data };
}

function normalizeResult(result) {
  if (result == null) return null;
  if (typeof result === 'string') {
    const trimmed = result.trim();
    if (!trimmed) return result;
    try {
      return JSON.parse(trimmed);
    } catch {
      return result;
    }
  }
  return result;
}



export async function getWardList() {
  const res = await api.post('/Diet/getWardlist'); 

  

  const data = res?.data;
  console.log('WARD DATA:', data);

 
  if (Array.isArray(data?.response)) {
    return data.response; 
  }

  return [];
}


function formatYYYYMMDD(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export async function getBedList({ wardId, date }) {

  const formattedDate = formatYYYYMMDD(date); 

  console.log("Sending Date:", formattedDate);

  const res = await api.post('/Diet/getWardBedlist', {
    stationID: wardId,
    orderDate: formattedDate,   // ✅ ONLY yyyymmdd
  });

  const data = res?.data;
  console.log(data)
  if (Array.isArray(data?.response)) return data.response;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export async function getDietMealType() {
  const res = await api.post('/Diet/getDietMealType', {
    locationID: locationID, 
  });

  const data = res?.data;

  console.log('MEAL TYPE API:', data);

  if (Array.isArray(data?.response)) {
    return data.response; // ✅ returns array like [{id, name}]
  }

  return [];
}