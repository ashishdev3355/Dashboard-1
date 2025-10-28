import { BrowserRouter,Route,Routes } from "react-router-dom";
import Api1 from "./Services/Api1";
import Api2 from "./Services/Api2";
import BikeMakeList from './Services/BikeMakeList.tsx'
import ModelListPage from './Services/ModelListPage.tsx'
import Customcommands1 from './Services/Customcommands1.tsx'
import Layout from "./Compontens/Layout.tsx";
import ActuationFetcher from './Services/ActuationFetcher .tsx'
import CommandFetcher from './Services/CommandFetcher .tsx'
import OdometerDetails from './Services/OdometerDetails.tsx'
import FileUploader from './Services/Updatecommand.tsx'
import UsersTable from "./Services/UsersTable.tsx";
import ObdScanReport from "./Services/Scandetail.tsx";
import ScanDetailPage from "./Compontens/ScanDetails/ScanDetailsPage.tsx"; 
import SpdetailsPage from "./Compontens/SpecialFunctions/SpdetailsPage.tsx"; 
import ActuationsDetailpage from "./Compontens/ActuationsDetails/ActuationsDetailpage.tsx"; 
import SpecilaFunction from "./Services/SpecialFunctions.tsx";
import ActuationsDetail from "./Services/ActuationsDetail.tsx";
import FaultCodesUploader from "./Services/FaultCodesUploader.tsx";
import ActivationCodesUploader from "./Services/ActivationCodesUploader.tsx";
import LiveDataCommands from "./Services/LiveDataCommands.tsx";
import FaultCodesUploader2 from "./Services/FaultCodesUploader2.tsx";
import FaultCodeSymptoms from "./Services/FaultCodeSymptoms.tsx";
import FaultCodeSolutions from "./Services/FaultCodeSolutions.tsx";
import FaultCodeCauses from "./Services/FaultCodeCauses.tsx";
import FaultCodeList from "./Services/FaultCodeList.tsx";
// import Signup from "./pages/Signup.tsx";
import Login from "./pages/Login.tsx";
import RequireAuth from "./RequireAuth.tsx";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/signup" element={<Signup />} /> */}
        {/* <Route path="/" element={<Signup />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="api1" element={<Api1 />} />
          <Route path="api2" element={<Api2 />} />
          <Route path="ObdScanReport" element={<ObdScanReport />} />
          <Route path="ObdScanReport/details/:id" element={<ScanDetailPage />} />
          <Route path="SpecilaFunction" element={<SpecilaFunction />} />
          <Route path="SpecialFunctions/details" element={<SpdetailsPage />} />
          <Route path="ActuationsDetail" element={<ActuationsDetail />} />
          <Route path="ActuationsDetail/details" element={<ActuationsDetailpage />} />
          <Route path="BikeMakeList" element={<BikeMakeList />} />
          <Route path="UsersTable" element={<UsersTable />} />
          <Route path="CommandFetcher" element={<CommandFetcher />} />
          <Route path="Customcommands1" element={<Customcommands1 />} />
          <Route path="ActuationFetcher" element={<ActuationFetcher />} />
          <Route path="ModelListPage" element={<ModelListPage />} />
          <Route path="LiveDataCommands" element={<LiveDataCommands />} />
          <Route path="OdometerDetails" element={<OdometerDetails />} />
          <Route path="Updatecommand" element={<FileUploader />} />
          <Route path="FaultCodesUploader" element={<FaultCodesUploader />} />
          <Route path="FaultCodesUploader2" element={<FaultCodesUploader2 />} />
          <Route path="ActivationCodesUploader" element={<ActivationCodesUploader />} />
          <Route path="FaultCodeSymptoms" element={<FaultCodeSymptoms />} />
          <Route path="FaultCodeSolutions" element={<FaultCodeSolutions />} />
          <Route path="FaultCodeCauses" element={<FaultCodeCauses />} />
          <Route path="FaultCodeList" element={<FaultCodeList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default App