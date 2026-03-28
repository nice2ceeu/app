import { StrictMode } from 'react'
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ProfileProvider } from "./context/ProfileContext";
import App from './App.jsx'
import './index.css'


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js') 
    .then(reg => console.log('Service Worker registered', reg))
    .catch(err => console.error('SW registration error', err));
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </BrowserRouter>
); 