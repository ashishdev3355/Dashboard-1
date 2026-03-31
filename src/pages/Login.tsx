// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, AuthResponse } from "../auth";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import { LayoutDashboard } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    const cleanEmail = email.trim();
    const res: AuthResponse = await login(cleanEmail, password);
    setIsLoading(false);

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/30 mb-4">
            <LayoutDashboard className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to manage your OBD dashboard</p>
        </div>

        <Card className="glass-card !bg-white/80 border-slate-100 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {message && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-shake">
                <span className="font-bold">Error:</span> {message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don’t have an account?{" "}
              <button
                className="text-primary-600 font-bold hover:text-primary-700 transition-colors"
                onClick={() => navigate("/signup")}
              >
                Request Access
              </button>
            </p>
          </div>
        </Card>
        
        <p className="text-center text-slate-400 text-xs mt-8">
          &copy; 2025 OBD Dashboard. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Login;
