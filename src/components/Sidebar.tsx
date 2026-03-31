import { NavLink } from "react-router-dom";
import { 
  Users, 
  ShieldCheck, 
  Terminal, 
  Settings, 
  Activity, 
  Code, 
  FileCode, 
  Layers, 
  Bike, 
  Car, 
  History, 
  Zap, 
  AlertTriangle, 
  CheckSquare, 
  FileUp, 
  Key,
  TrendingUp,
  Fingerprint
} from "lucide-react";

interface MenuItem {
  label: string;
  path: string;
  icon: any;
}

const menuItems: MenuItem[] = [
  { label: "Role Management", path: "/AdminUsers", icon: Fingerprint },
  { label: "Users Table", path: "/UsersTable", icon: Users },
  { label: "Covarage Data", path: "/Api1", icon: ShieldCheck },
  { label: "Mechanic Commands", path: "/Api2", icon: Terminal },
  { label: "Cars Scans", path: "/ObdScanReport", icon: History },
  { label: "Special Function", path: "/SpecilaFunction", icon: Zap },
  { label: "Actuations Detail", path: "/ActuationsDetail", icon: Activity },
  { label: "Custom commands", path: "/Customcommands1", icon: Code },
  { label: "Actuation commands", path: "/ActuationFetcher", icon: FileCode },
  { label: "SPF Commands", path: "/CommandFetcher", icon: Layers },
  { label: "Model List Page", path: "/ModelListPage", icon: Car },
  { label: "Bike Make List", path: "/BikeMakeList", icon: Bike },
  { label: "Odometer commands", path: "/OdometerDetails", icon: TrendingUp },
  { label: "Live Commands", path: "/LiveDataCommands", icon: Settings },
  { label: "Fault Code Symptoms", path: "/FaultCodeSymptoms", icon: AlertTriangle },
  { label: "Fault Code Solutions", path: "/FaultCodeSolutions", icon: CheckSquare },
  { label: "Fault Code Causes", path: "/FaultCodeCauses", icon: AlertTriangle },
  { label: "Fault Code List", path: "/FaultCodeList", icon: ListIcon },
  { label: "Cars Scans Uplode", path: "/Updatecommand", icon: FileUp },
  { label: "Fault Code Uplode", path: "/FaultCodesUploader", icon: UploadIcon },
  { label: "Activation Code Uplode", path: "/ActivationCodesUploader", icon: Key },
  { label: "Commands Uplode", path: "/FaultCodesUploader2", icon: Zap },
  { label: "Live Commands Uplode", path: "/LiveDataCommandsUploader", icon: Zap },
];

function ListIcon({ size, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function UploadIcon({ size, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function Sidebar() {
  const role_id = localStorage.getItem("role_id");
  const filteredMenuItems = menuItems.filter(item => item.path !== "/AdminUsers" || role_id === "1");

  return (
    <div className="bg-white h-screen w-64 flex flex-col border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
          <Settings className="text-white w-6 h-6 animate-spin-slow" />
        </div>
        <h2 className="text-xl font-black text-slate-800 tracking-tighter">
          OBD <span className="text-primary-600">CORE</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4">Registry Management</p>
        <div className="space-y-1">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 group ${isActive
                  ? "bg-primary-600 text-white shadow-xl shadow-primary-100 scale-[1.02]"
                  : "text-slate-500 hover:bg-primary-50 hover:text-primary-600"
                }`
              }
            >
              <item.icon size={18} className={`transition-transform duration-300 group-hover:scale-110`} />
              <span className="tracking-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      
      <div className="p-6 border-t border-slate-50">
         <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100/50">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black text-[10px]">AD</div>
            <div className="overflow-hidden">
               <p className="text-[11px] font-black text-slate-700 truncate">Administrator</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Root Access</p>
            </div>
         </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}

export default Sidebar;
