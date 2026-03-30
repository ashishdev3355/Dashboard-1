import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AdminUser {
  id: number;
  email: string;
  role_id: string;
  role_name: string;
}

interface Role {
  id: string;
  name: string;
}

const AdminUsersTable: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // New User Form State
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  
  // OTP Flow State
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");

  const [createMessage, setCreateMessage] = useState("");
  const [generatedCreds, setGeneratedCreds] = useState<{email:string, password:string} | null>(null);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/admin/roles`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data || []);
      }
    } catch (err) {
      console.error('Fetch roles error:', err);
    }
  };

  const fetchAdminUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/admin/users`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError("Failed to fetch dashboard users");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!newEmail) {
      setOtpMessage("Email is required to send OTP");
      return;
    }
    setOtpLoading(true);
    setOtpMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/admin/send-otp`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: newEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setIsOtpSent(true);
        setOtpMessage("OTP sent successfully to " + newEmail);
      } else {
        setOtpMessage(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setOtpMessage("Error sending OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpMessage("Please enter the OTP");
      return;
    }
    setOtpLoading(true);
    setOtpMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/admin/verify-otp`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: newEmail, otp })
      });
      const data = await response.json();
      if (response.ok) {
        setIsEmailVerified(true);
        setOtpMessage("Email verified successfully! ✅");
      } else {
        setOtpMessage(data.error || "Invalid OTP");
      }
    } catch (err) {
      setOtpMessage("Error verifying OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMessage("");
    setGeneratedCreds(null);

    if (!isEmailVerified) {
      setCreateMessage("Email must be verified first");
      return;
    }

    if (!newRoleId) {
      setCreateMessage("Please select a role");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/admin/create-user`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          email: newEmail, 
          password: newPassword, 
          role_id: newRoleId 
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setCreateMessage(data.error || "Failed to create user");
      } else {
        setCreateMessage("User created successfully!");
        if (data.credentials) {
          setGeneratedCreds(data.credentials);
        }
        // Reset form
        setNewEmail("");
        setNewPassword("");
        setNewRoleId("");
        setOtp("");
        setIsOtpSent(false);
        setIsEmailVerified(false);
        setOtpMessage("");
        fetchAdminUsers();
      }
    } catch (err) {
      console.error('Create user error:', err);
      setCreateMessage("Error creating user");
    }
  };

  const updateRole = async (userId: number, roleId: string) => {
    if (!roleId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role_id: roleId })
      });

      if (!response.ok) throw new Error("Failed to update role");
      alert("Role updated successfully!");
      fetchAdminUsers();
    } catch(err) {
      console.error('Update role error:', err);
      alert("Error updating role");
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      if (response.ok) {
        alert("User deleted successfully!");
        fetchAdminUsers();
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert("Error deleting user");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  useEffect(() => {
    fetchAdminUsers();
    fetchRoles();
  }, []);

  const currentRole = localStorage.getItem("role_id");
  if (currentRole !== "1") {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <h2 className="text-3xl font-bold text-red-600">Access Denied. Admin privileges required.</h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 font-primary">Secure User Management & RBAC</h2>
        
        {/* Create User Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 max-w-5xl">
          <h3 className="text-xl font-bold mb-6 text-gray-700 flex items-center">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
            Admin-Only User Creation
          </h3>
          
          <div className="space-y-6">
            {/* Step 1: Email & OTP */}
            <div className={`p-4 rounded-lg border-2 transition-all ${isEmailVerified ? 'border-green-200 bg-green-50' : 'border-blue-100 bg-blue-50/30'}`}>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[250px]">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Step 1: Verify Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter user's email address" 
                    className={`p-3 border rounded-lg w-full outline-none transition-all ${isEmailVerified ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={isEmailVerified}
                    required
                  />
                </div>
                {!isEmailVerified && (
                  <button 
                    onClick={handleSendOtp}
                    disabled={otpLoading || !newEmail}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 h-[50px]"
                  >
                    {otpLoading ? 'Sending...' : (isOtpSent ? 'Resend OTP' : 'Send OTP')}
                  </button>
                )}
              </div>

              {isOtpSent && !isEmailVerified && (
                <div className="mt-4 flex flex-wrap items-end gap-4 animate-fadeIn">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enter 6-Digit OTP</label>
                    <input 
                      type="text" 
                      placeholder="XXXXXX" 
                      className="p-3 border rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.5em] text-center font-bold text-xl"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <button 
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otp.length !== 6}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 h-[50px]"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </div>
              )}
              {otpMessage && (
                <p className={`mt-3 text-sm font-semibold flex items-center ${otpMessage.includes('✅') || otpMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                   {otpMessage}
                </p>
              )}
            </div>

            {/* Step 2: Form */}
            <form onSubmit={handleCreateUser} className={`transition-all duration-500 ${isEmailVerified ? 'opacity-100 scale-100' : 'opacity-30 scale-95 pointer-events-none'}`}>
              <div className="p-4 rounded-lg border-2 border-gray-100 bg-gray-50/50">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-4">Step 2: Account Details</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Assign Security Role</label>
                    <select 
                      className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newRoleId}
                      onChange={(e) => setNewRoleId(e.target.value)}
                      required={isEmailVerified}
                    >
                      <option value="" disabled>Choose Role...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Custom Password (Optional)</label>
                    <input 
                      type="password" 
                      placeholder="Leave blank for auto-gen" 
                      className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit" 
                      className="bg-blue-600 text-white w-full py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg h-[50px]"
                    >
                      Complete & Create User
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {createMessage && (
            <div className={`mt-6 p-4 rounded-lg flex items-center ${createMessage.includes('successfully') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              <p className="font-semibold">{createMessage}</p>
            </div>
          )}

          {generatedCreds && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-xl text-white animate-slideUp">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-bold flex items-center">
                  <span className="mr-2">🎉</span> Account Created Successfully
                </h4>
                <button onClick={() => setGeneratedCreds(null)} className="text-white/60 hover:text-white transition">✕</button>
              </div>
              <p className="mb-6 text-blue-100 text-sm">The following credentials have been sent to the user's email. You can also copy them below.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                  <p className="text-xs font-bold text-blue-200 uppercase mb-1">Login Email</p>
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{generatedCreds.email}</span>
                    <button onClick={() => copyToClipboard(generatedCreds.email)} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">COPY</button>
                  </div>
                </div>
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                  <p className="text-xs font-bold text-blue-200 uppercase mb-1">Access Password</p>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold tracking-wider">{generatedCreds.password}</span>
                    <button onClick={() => copyToClipboard(generatedCreds.password)} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">COPY</button>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center p-3 bg-yellow-400/20 border border-yellow-400/30 rounded-lg text-sm italic">
                 <span className="mr-2">ℹ️</span> The user will be forced to change this password on their first login.
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-700">Database User Registry</h3>
            <span className="text-xs font-bold text-gray-400 uppercase">Active Connections: {users.length}</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">
               <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
               Fetching registry...
            </div>
          ) : error ? (
            <p className="p-12 text-red-500 text-center font-bold">{error}</p>
          ) : users.length === 0 ? (
            <p className="p-12 text-gray-500 text-center">No users found in the registry.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">User ID</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Email Identity</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Current Privilege</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Assign Role</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap text-gray-400 font-mono">#{user.id.toString().padStart(4, '0')}</td>
                      <td className="px-8 py-5 whitespace-nowrap font-medium text-gray-700">{user.email}</td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role_id === '1' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {user.role_name || 'Restricted'}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <select 
                          className="p-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                          value={user.role_id || ''} 
                          onChange={(e) => updateRole(user.id, e.target.value)}
                        >
                          <option value="" disabled>Change Security Role</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete User"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s ease-out forwards; }
        .font-primary { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      `}</style>
    </div>
  );
};

export default AdminUsersTable;
