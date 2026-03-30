// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, AuthResponse } from "../auth";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const res: AuthResponse = await login(cleanEmail, password);
    if (res.token) {
      if (res.user && res.user.role_id) {
        localStorage.setItem("role_id", res.user.role_id);
      }
      if (res.user && res.user.must_change_password) {
        localStorage.setItem("must_change_password", "true");
        navigate("/change-password");
      } else {
        localStorage.setItem("must_change_password", "false");
        navigate("/UsersTable"); // redirect after login
      }
    } else {
      setMessage(res.error || "Login failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Login
        </button>

        {message && <p className="mt-3 text-red-600">{message}</p>}

        <p className="mt-3 text-sm">
          Don’t have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Signup
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
