import React from 'react';
import { 
  ClipboardList, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Hash, 
  User, 
  Terminal
} from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';
import HeaderAndValue from '../reusable/HeaderAndValue';

interface DecodedArrayItem {
  pid: string;
  data: string;
  decodedFaultArray: Record<string, string>;
  header: string;
  protocol: string;
  system: string;
}

interface ScanResItem {
  data: string;
  header: string;
  make: string;
  pid: string;
  protocol: string;
  system: string;
}

interface ScanProps {
  ScanArray: ScanResItem[] | null;
  DecodeArray: DecodedArrayItem[] | null;
  start_time: string;
  end_time: string;
  license_plate: string;
  email: string;
  app_version: string;
  scan_ended: string;
  functiones: string;
  type: string;
}

const ScanDcodeArr: React.FC<ScanProps> = ({
  ScanArray,
  DecodeArray,
  start_time,
  end_time,
  license_plate,
  email,
  app_version,
  functiones,
  type,
  scan_ended
}) => {
  const calculateDuration = () => {
    const start = new Date(start_time);
    const end = new Date(end_time);
    const diffInMs = end.getTime() - start.getTime();
    if (isNaN(diffInMs)) return 'N/A';
    const seconds = Math.floor(diffInMs / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Overview Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</p>
            <p className="text-sm font-black text-slate-700">{calculateDuration()}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Hash size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reports</p>
            <p className="text-sm font-black text-slate-700">{ScanArray?.length || 0} Frames</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version</p>
            <p className="text-sm font-black text-slate-700">{app_version}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <User size={20} />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</p>
            <p className="text-sm font-black text-slate-700 truncate">{email}</p>
          </div>
        </div>
      </div>

      <Card title="Diagnostic Session Summary" icon={ClipboardList}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">License Plate</p>
            <p className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block font-mono tracking-tighter">
              {license_plate}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Session Protocol</p>
            <p className="text-sm font-bold text-slate-700">{type || 'Standard OBD'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Operation</p>
            <p className="text-sm font-bold text-slate-700">{functiones || 'System Scan'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Execution Status</p>
            <Badge variant={scan_ended === 'true' ? 'success' : 'warning'}>
              {scan_ended === 'true' ? 'Fully Finalized' : 'Session Interrupted'}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Start Timeline</p>
            <p className="text-xs font-medium text-slate-500 italic">{new Date(start_time).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">End Timeline</p>
            <p className="text-xs font-medium text-slate-500 italic">{new Date(end_time).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Decoded Fault Codes Section */}
      <Card 
        noPadding 
        title="Analysis: Decoded Fault Codes" 
        headerAction={<Badge variant={DecodeArray && DecodeArray.length > 0 ? 'danger' : 'success'}>
          {DecodeArray?.length || 0} Issues Found
        </Badge>}
        icon={AlertCircle}
      >
        {DecodeArray && DecodeArray.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 italic">
                  <HeaderAndValue header={true} Title="System" />
                  <HeaderAndValue header={true} Title="PID" />
                  <HeaderAndValue header={true} Title="Frame Data" />
                  <HeaderAndValue header={true} Title="Protocol" />
                  <HeaderAndValue header={true} Title="Fault Definitions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {DecodeArray.map((decoded, idx) => (
                  <tr key={idx} className="hover:bg-red-50/20 transition-colors group">
                    <td className="px-4 py-4 font-bold text-slate-700">{decoded.system}</td>
                    <td className="px-4 py-4"><code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-700 font-bold">{decoded.pid}</code></td>
                    <td className="px-4 py-4 font-mono text-slate-400">{decoded.data}</td>
                    <td className="px-4 py-4 text-slate-400">{decoded.protocol}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        {Object.entries(decoded.decodedFaultArray).map(([code, status]) => (
                          <div key={code} className="flex items-start gap-2 group/msg">
                            <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px] min-w-[50px] text-center border border-red-100">{code}</span>
                            <span className="text-slate-600 font-medium leading-relaxed">{status}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-slate-500 font-bold">Electronic Systems Healthy</p>
            <p className="text-slate-400 text-sm mt-1">No diagnostic trouble codes detected in this frame.</p>
          </div>
        )}
      </Card>

      {/* Raw Scan Results Section */}
      <Card noPadding title="Raw Telemetry Data" icon={Terminal} subtitle="Complete register state captures">
        {ScanArray && ScanArray.length > 0 ? (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <HeaderAndValue header={true} Title="System" />
                  <HeaderAndValue header={true} Title="PID" />
                  <HeaderAndValue header={true} Title="Hex Payload" />
                  <HeaderAndValue header={true} Title="Header" />
                  <HeaderAndValue header={true} Title="Protocol" />
                  <HeaderAndValue header={true} Title="Manufacturer" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ScanArray.map((item, index) => (
                  <tr key={index} className="hover:bg-primary-50/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{item.system}</td>
                    <td className="px-4 py-3"><code className="text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{item.pid}</code></td>
                    <td className="px-4 py-3 font-mono text-slate-400 tracking-widest uppercase">{item.data}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono italic">{item.header}</td>
                    <td className="px-4 py-3 text-slate-400">{item.protocol}</td>
                    <td className="px-4 py-3 text-slate-400">{item.make}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <p className="text-slate-400 italic">No telemetry buffers captured.</p>
          </div>
        )}
      </Card>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default ScanDcodeArr;
