import React, { useEffect, useState } from 'react';
import { 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Users as UsersIcon,
  Fingerprint
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Badge from '../components/Badge';

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
      <div className="flex min-h-screen bg-slate-50 items-center justify-center p-8">
        <Card className="max-w-md w-full bg-red-50 border-red-100 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-red-700 tracking-tight">Access Denied</h2>
          <p className="text-red-600 mt-2">Administrator privileges are required to access this dashboard registry.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Access Control Center</h2>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary-500" />
            Manage roles and user permissions through the RBAC system.
          </p>
        </div>
      </div>
      
      {/* Create User Section */}
      <Card 
        title="Admin-Only User Creation" 
        subtitle="Authenticate and provision new user accounts securely."
        className="glass-card"
        headerAction={<Badge variant="purple">Restricted Access</Badge>}
      >
        <div className="space-y-8">
          {/* Step 1: Email & OTP */}
          <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${isEmailVerified ? 'border-emerald-100 bg-emerald-50/50 shadow-sm shadow-emerald-50' : 'border-primary-100 bg-primary-50/30'}`}>
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              <div className="flex-1 w-full">
                <Input 
                  label="Step 1: User Identity" 
                  placeholder="name@company.com" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isEmailVerified}
                  required
                />
              </div>
              {!isEmailVerified && (
                <Button 
                  onClick={handleSendOtp}
                  disabled={otpLoading || !newEmail}
                  isLoading={otpLoading}
                  className="min-w-[160px] h-[52px]"
                >
                  {isOtpSent ? 'Resend OTP' : 'Send OTP'}
                </Button>
              )}
            </div>

            {isOtpSent && !isEmailVerified && (
              <div className="mt-8 pt-8 border-t border-primary-100/50 flex flex-col md:flex-row items-center md:items-end gap-6 animate-fadeIn">
                <div className="flex-1 w-full">
                  <Input 
                    label="Verification Code" 
                    placeholder="Enter 6-digit OTP" 
                    maxLength={6}
                    className="text-center tracking-widest font-black text-xl"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <Button 
                  variant="primary"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otp.length !== 6}
                  isLoading={otpLoading}
                  className="min-w-[160px] h-[52px] !bg-emerald-600 hover:!bg-emerald-700"
                >
                  Verify Email
                </Button>
              </div>
            )}
            
            {otpMessage && (
              <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl border ${otpMessage.includes('✅') || otpMessage.includes('successfully') ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {otpMessage.includes('✅') ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                 <p className="text-sm font-semibold">{otpMessage}</p>
              </div>
            )}
          </div>

          {/* Step 2: Form */}
          <form onSubmit={handleCreateUser} className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-500 ${isEmailVerified ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Assign Security Role</label>
              <select 
                className="premium-input w-full"
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value)}
                required={isEmailVerified}
              >
                <option value="" disabled>Select Role...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <Input 
                label="Custom Password" 
                type="password" 
                placeholder="Auto-generate if empty" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button 
                type="submit" 
                className="w-full h-[52px]"
                icon={UserPlus}
              >
                Create Account
              </Button>
            </div>
          </form>
        </div>

        {createMessage && (
          <div className={`mt-8 p-4 rounded-2xl flex items-center gap-3 ${createMessage.includes('successfully') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {createMessage.includes('successfully') ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-bold">{createMessage}</p>
          </div>
        )}

        {generatedCreds && (
          <div className="mt-10 p-8 bg-slate-900 rounded-3xl shadow-2xl text-white animate-slideUp border border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-black tracking-tight">Provisioning Successful</h4>
              </div>
              <button onClick={() => setGeneratedCreds(null)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">User Email</p>
                <div className="flex justify-between items-center group">
                  <span className="font-mono text-slate-200">{generatedCreds.email}</span>
                  <button onClick={() => copyToClipboard(generatedCreds.email)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-lg transition-all text-emerald-400">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Access Token</p>
                <div className="flex justify-between items-center group">
                  <span className="font-mono font-black text-primary-400 text-lg tracking-wider">{generatedCreds.password}</span>
                  <button onClick={() => copyToClipboard(generatedCreds.password)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-lg transition-all text-emerald-400">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl text-primary-200 text-sm italic">
               <span className="mr-3">ℹ️</span> Mandatory password cycle triggered: user must change credentials on first authentication.
            </div>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card noPadding title="Database User Registry" headerAction={<Badge variant="secondary">Active Count: {users.length}</Badge>}>
        {loading ? (
          <div className="p-24 text-center">
             <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
             <p className="text-slate-400 font-medium tracking-wide">Connecting to Registry...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-500 font-black">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-24 text-center">
            <UsersIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No records found in active registry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Identity</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Role</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">RBAC Actions</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Purge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-primary-50/30 transition-all duration-200 group">
                    <td className="px-8 py-5 whitespace-nowrap text-slate-300 font-mono text-xs">#{user.id.toString().padStart(4, '0')}</td>
                    <td className="px-8 py-5 whitespace-nowrap font-bold text-slate-700">{user.email}</td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <Badge variant={user.role_id === '1' ? 'purple' : 'primary'}>
                        {user.role_name || 'Restricted'}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-center">
                      <select 
                        className="premium-input !py-1.5 !px-3 !text-xs font-bold bg-transparent border-transparent group-hover:border-slate-200 group-hover:bg-white"
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
                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Delete User"
                      >
                        <Trash2 className="h-5 w-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default AdminUsersTable;
