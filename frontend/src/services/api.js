import axios from 'axios';

// Configure the base URL for the API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const uploadFiles = async (files) => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

export const getFiles = async () => {
  try {
    const response = await api.get('/files');
    return response.data;
  } catch (error) {
    console.error('Error getting file list:', error);
    throw error;
  }
};

export const downloadFile = (filename) => {
  // Return the URL for direct download
  return `${API_BASE_URL}/download/${filename}`;
};

export const downloadSelectedFiles = async (filenames) => {
  try {
    // Use direct window.location.href for file download
    const response = await api.post('/download-selected', { filenames }, {
      responseType: 'blob',
    });
    
    // Create a temporary URL for the blob and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `selected_pdfs.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading selected files:', error);
    throw error;
  }
};

export const downloadAllFiles = () => {
  // Trigger direct download via window.location
  window.location.href = `${API_BASE_URL}/download-all`;
  return true;
};

export default api; 