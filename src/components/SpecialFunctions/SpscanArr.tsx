import React from 'react';
import { 
  Terminal, 
  Activity, 
  Database, 
  Layers,
  Info
} from 'lucide-react';
import HeaderAndValue from '../reusable/HeaderAndValue';
import Card from '../Card';
import Badge from '../Badge';

interface ScanResItem {
  data: string;
  header: string;
  pid: string;
  protocol: string;
  system: string;
}

interface SpscanProps {
  ScanArray: ScanResItem[];
  start_time: string;
  end_time: string;
  email: string;
  make: string;
}

const SpscanArr: React.FC<SpscanProps> = ({ ScanArray, start_time, end_time, email, make }) => {
  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <Database size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Frames</p>
            <p className="text-sm font-black text-slate-700">{ScanArray?.length || 0}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manufacturer</p>
            <p className="text-sm font-black text-slate-700">{make || "Generic"}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity size={20} />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyst</p>
            <p className="text-sm font-black text-slate-700 truncate">{email}</p>
          </div>
        </div>
      </div>

      <Card noPadding title="Special Function Telemetry" icon={Terminal}>
        {ScanArray && ScanArray.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 italic">
                  <HeaderAndValue header={true} Title="Target System" />
                  <HeaderAndValue header={true} Title="PID" />
                  <HeaderAndValue header={true} Title="Hex Payload" />
                  <HeaderAndValue header={true} Title="Protocol" />
                  <HeaderAndValue header={true} Title="Header" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ScanArray.map((item, index) => (
                  <tr key={index} className="hover:bg-primary-50/20 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-700">{item.system}</td>
                    <td className="px-4 py-4">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-primary-600 font-bold tracking-tighter">
                        {item.pid}
                      </code>
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-400 tracking-widest uppercase">{item.data}</td>
                    <td className="px-4 py-4 text-slate-400 font-medium">{item.protocol}</td>
                    <td className="px-4 py-4 text-slate-400 italic text-[10px]">{item.header}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium tracking-wide">No specialized scan data available in this capture.</p>
          </div>
        )}
      </Card>

      <div className="flex justify-between items-center px-2">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Capture Timeline: {new Date(start_time).toLocaleTimeString()} — {new Date(end_time).toLocaleTimeString()}
        </p>
        <Badge variant="secondary">Buffer: {ScanArray?.length || 0} Frames</Badge>
      </div>
    </div>
  );
};

export default SpscanArr;
