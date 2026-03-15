import { StrictMode } from 'react'
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ProfileProvider } from "./context/ProfileContext";
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </BrowserRouter>
);