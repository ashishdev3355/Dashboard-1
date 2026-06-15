import { useLocation,useNavigate } from "react-router-dom";
import ActuationArray from "./ActuationsArray";


const ActuationDetailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const {ScanArray, created_at, updated_at, email, make,  model} = location.state || {}
     return (
    <div className="p-4 ml-7">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-300 px-4 py-2 rounded"
      >
        ⬅ Back
      </button>

      <h1 className="text-xl font-bold mb-2 ml-6">Actuations Array Details</h1>

      <ActuationArray ScanArray={ScanArray} created_at={created_at} updated_at ={updated_at} email={email} make={make} model={model}/>
     

    </div>
  );
}

export default ActuationDetailPage;