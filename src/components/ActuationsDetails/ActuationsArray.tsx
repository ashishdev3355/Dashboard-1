import React from 'react';
import { 
  Activity, 
  Terminal, 
  Database,
  Layers,
  Cpu
} from 'lucide-react';
import HeaderAndValue from '../reusable/HeaderAndValue';
import Card from '../Card';
import Badge from '../Badge';

interface ActuationsArrayProps {
  ActuationsArray: any[];
  created_at?: string;
  updated_at?: string;
  email?: string;
  make?: string;
  model?: string;
}

const ActuationsArray: React.FC<ActuationsArrayProps> = ({ 
  ActuationsArray, 
  created_at, 
  updated_at, 
  email, 
  make, 
  model 
}) => {
  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
            <p className="text-sm font-black text-slate-700">Sequence Online</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Database size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payloads</p>
            <p className="text-sm font-black text-slate-700">{ActuationsArray?.length || 0} Commands</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm md:col-span-2 lg:col-span-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <Layers size={20} />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration</p>
            <p className="text-sm font-black text-slate-700 truncate">{make} {model}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm md:col-span-2 lg:col-span-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
            <Cpu size={20} />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyst</p>
            <p className="text-sm font-black text-slate-700 truncate">{email}</p>
          </div>
        </div>
      </div>

      <Card 
        noPadding 
        title="Execution Protocol Stream" 
        icon={Terminal} 
        subtitle={`System triggers captured between ${created_at ? new Date(created_at).toLocaleTimeString() : 'N/A'} and ${updated_at ? new Date(updated_at).toLocaleTimeString() : 'N/A'}`}
      >
        {ActuationsArray && ActuationsArray.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 italic">
                  <HeaderAndValue header={true} Title="Target Subsystem" />
                  <HeaderAndValue header={true} Title="PID" />
                  <HeaderAndValue header={true} Title="Instruction Hex" />
                  <HeaderAndValue header={true} Title="Session Header" />
                  <HeaderAndValue header={true} Title="Logic" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ActuationsArray.map((item, index) => (
                  <tr key={index} className="hover:bg-primary-50/30 transition-colors group">
                    <td className="px-4 py-4 font-bold text-slate-700">{item.system}</td>
                    <td className="px-4 py-4">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-primary-600 font-bold tracking-tighter">
                        {item.pid}
                      </code>
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-400 tracking-widest uppercase">{item.data}</td>
                    <td className="px-4 py-4 text-slate-400 font-mono text-[10px] italic">{item.header}</td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary">0x{item.protocol || '7F'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <p className="text-slate-400 font-medium tracking-wide italic">No instruction buffers captured in this sequence.</p>
          </div>
        )}
      </Card>
      
      <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between text-white/90">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnostic Stream Active</p>
        </div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
          Engine Latency: 12ms | Buffer: {ActuationsArray?.length || 0} Frames
        </div>
      </div>
    </div>
  );
};

export default ActuationsArray;
