import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";
import TaglineSection from "./TaglineSection";

// Configure base API
const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

function App() {
  // --- 1. STATES (Now inside the function) ---
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", description: "", price: "", quantity: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 2. AUTHENTICATION INTERCEPTOR ---
  // This automatically attaches your JWT to every request
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, [token]);

  // --- 3. LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("Attempting login with:", loginData.username);

    const formData = new FormData();
    formData.append("username", loginData.username);
    formData.append("password", loginData.password);

    try {
      const res = await axios.post("http://127.0.0.1:8000/token", formData);
      const newToken = res.data.access_token;
      
      console.log("Login successful! Token received.");
      setToken(newToken);
      localStorage.setItem("token", newToken);
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      setError("Invalid username or password. Use admin / password123");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
    setProducts([]);
  };

  // --- 4. DATA FETCHING ---
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  useEffect(() => {
    if (token) fetchProducts();
  }, [token]);

  // --- 5. UI RENDERING ---

  // LOGIN SCREEN
  if (!token) {
    return (
      <div className="login-overlay">
        <div className="card login-card">
          <h2>📦 Telusko Trac Login</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="text" 
              placeholder="Username (admin)" 
              value={loginData.username} 
              onChange={(e) => setLoginData({...loginData, username: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password (password123)" 
              value={loginData.password} 
              onChange={(e) => setLoginData({...loginData, password: e.target.value})} 
              required 
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          {error && <p className="error-msg" style={{color: "red", marginTop: "10px"}}>{error}</p>}
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="app-bg">
      <header className="topbar">
        <div className="brand"><h1>Telusko Trac</h1></div>
        <button className="btn btn-light" onClick={handleLogout}>Logout</button>
      </header>
      
      <div className="container">
        <div className="stats">
          <div className="chip">Items in PostgreSQL: {products.length}</div>
        </div>

        <div className="content-grid">
          <TaglineSection />
          
          <div className="card list-card">
            <h2>Inventory List</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;