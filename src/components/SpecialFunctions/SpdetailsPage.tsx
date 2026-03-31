
import { useLocation, useNavigate } from "react-router-dom";
import SpscanArr from "../SpecialFunctions/SpscanArr";

const ScanDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ScanArray, start_time,end_time,email, make } = location.state || {};
  
  return (
    <div className="p-4 ml-7">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-300 px-4 py-2 rounded"
      >
        ⬅ Back
      </button>

      <h1 className="text-xl font-bold mb-2 ml-6">Scan Array Details</h1>

      
      <SpscanArr ScanArray= {ScanArray} start_time={start_time} end_time={end_time} email={email} make={make}/>

    </div>
  );
};

export default ScanDetailPage;













