import React from 'react';
import RowAndTitle from '../..//ReusedCompontets/RowAndTitile';
import HeaderAndValue from '../..//ReusedCompontets/HeaderAndValue';

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
  bluetooth_device?: string;
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
  scan_ended,
  bluetooth_device
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
    <div className="w-screen h-screen overflow-auto p-8 bg-white text-sm">
      <h1 className="text-2xl font-bold mb-6">Scan Results & Decoded Faults</h1>

      {/* Scan Detail Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Scan Details</h2>
        <table className="table-auto border border-collapse w-full text-left">
          <tbody>
            <tr>
              <RowAndTitle title="Start Time" value={start_time} />
              <RowAndTitle title="End Time" value={end_time} />
            </tr>
            <tr>
              <RowAndTitle title="License Plate" value={license_plate} />
              <RowAndTitle title="Email" value={email} />
            </tr>
            <tr>
              <RowAndTitle title="App Version" value={app_version} />
              <RowAndTitle title="Bluetooth Device" value={bluetooth_device} />
            </tr>
            <tr>
              <RowAndTitle title="Function" value={functiones} />
              <RowAndTitle title="Type" value={type} />
            </tr>
            <tr>
              <RowAndTitle title="Scan Duration" value={calculateDuration()} />
              <RowAndTitle title="Scan Ended" value={scan_ended} />
            </tr>
            <tr>
              <RowAndTitle title="Row Count" value={ScanArray?.length || 0} />
              <RowAndTitle title="" value="" />
            </tr>
          </tbody>
        </table>
      </section>

      {/* Decoded Fault Codes Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Decoded Fault Codes</h2>
        {DecodeArray && DecodeArray.length > 0 ? (
          <table className="table-auto w-full border border-collapse text-left">
            <thead className="bg-gray-100">
              <tr>
                <HeaderAndValue header={true} Title="System" />
                <HeaderAndValue header={true} Title="PID" />
                <HeaderAndValue header={true} Title="Data" />
                <HeaderAndValue header={true} Title="Protocol" />
                <HeaderAndValue header={true} Title="Header" />
                <HeaderAndValue header={true} Title="Decoded Faults" />
              </tr>
            </thead>
            <tbody>
              {DecodeArray.map((decoded, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <HeaderAndValue Title={decoded.system} />
                  <HeaderAndValue Title={decoded.pid} />
                  <HeaderAndValue Title={decoded.data} />
                  <HeaderAndValue Title={decoded.protocol} />
                  <HeaderAndValue Title={decoded.header} />
                  <td className="border px-4 py-2">
                    <ul className="list-disc pl-5">
                      {Object.entries(decoded.decodedFaultArray).map(([code, status]) => (
                        <li key={code}>
                          {code}: {status}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 italic">No decoded fault data available.</p>
        )}
      </section>

      {/* Raw Scan Results Section */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Raw Scan Results</h2>
        {ScanArray && ScanArray.length > 0 ? (
          <table className="table-auto w-full border border-collapse text-left">
            <thead className="bg-gray-100">
              <tr>
                <HeaderAndValue header={true} Title="System" />
                <HeaderAndValue header={true} Title="PID" />
                <HeaderAndValue header={true} Title="Data" />
                <HeaderAndValue header={true} Title="Header" />
                <HeaderAndValue header={true} Title="Protocol" />
                <HeaderAndValue header={true} Title="Make" />
              </tr>
            </thead>
            <tbody>
              {ScanArray.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <HeaderAndValue Title={item.system} />
                  <HeaderAndValue Title={item.pid} />
                  <HeaderAndValue Title={item.data} />
                  <HeaderAndValue Title={item.header} />
                  <HeaderAndValue Title={item.protocol} />
                  <HeaderAndValue Title={item.make} />
                </tr>
              ))}
            </tbody>+
          </table>
        ) : (
          <p className="text-gray-500 italic">No scan data available.</p>
        )}
      </section>
    </div>
  );
};

export default ScanDcodeArr;
