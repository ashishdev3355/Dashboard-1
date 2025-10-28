
// import { useLocation, useNavigate } from "react-router-dom";
// import ScanDcodeArr from "./ScanDcodeArr";

// const ScanDetailPage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { ScanArray, DecodeArray,start_time,end_time,license_plate,email,App_version,scan_ended,functiones,type } = location.state || {};

//   return (
//     <div className="p-4 ml-7">
//       <button
//         onClick={() => navigate(-1)}
//         className="mb-4 bg-gray-300 px-4 py-2 rounded"
//       >
//         ⬅ Back
//       </button>

//       <h1 className="text-xl font-bold mb-2 ml-6">Scan Decode Details</h1>

//       <ScanDcodeArr ScanArray={ScanArray} DecodeArray={DecodeArray} start_time={start_time} end_time={end_time}license_plate={license_plate} email={email} app_version={App_version} scan_ended={scan_ended} functiones={functiones} type={type} />
//     </div>
//   );
// };

// export default ScanDetailPage;








import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ScanDcodeArr from "./ScanDcodeArr";


const ScanDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ScanArray, DecodeArray, start_time, end_time, license_plate, email, App_version, scan_ended, functiones, type } = location.state || {};

  useEffect(() => {
    console.log('🔵 Details page mounted');
    sessionStorage.setItem('activePage', 'detailsPage');
    
    // Clear the navigation flag after mounting
    setTimeout(() => {
      const wasNavigating = sessionStorage.getItem('navigatingToDetails');
      console.log('Clearing navigatingToDetails flag, was:', wasNavigating);
      sessionStorage.removeItem('navigatingToDetails');
    }, 100);
    
    return () => {
      console.log('🔴 Details page unmounting - returning to scan page');
      // CRITICAL: Set flag to indicate we're returning to scan page
      sessionStorage.setItem('returningToScanPage', 'true');
      sessionStorage.setItem('activePage', 'scanDetailPage');
    };
  }, []);

  const handleBackClick = () => {
    // Set flag before navigating back
    sessionStorage.setItem('returningToScanPage', 'true');
    navigate(-1);
  };

  return (
    <div className="p-4 ml-7">
      <button
        onClick={handleBackClick}
        className="mb-4 bg-gray-300 px-4 py-2 rounded"
      >
        ⬅ Back
      </button>

      <h1 className="text-xl font-bold mb-2 ml-6">Scan Decode Details</h1>

      <ScanDcodeArr 
        ScanArray={ScanArray} 
        DecodeArray={DecodeArray} 
        start_time={start_time} 
        end_time={end_time}
        license_plate={license_plate} 
        email={email} 
        app_version={App_version} 
        scan_ended={scan_ended} 
        functiones={functiones} 
        type={type} 
      />
    </div>
  );
};

export default ScanDetailPage;