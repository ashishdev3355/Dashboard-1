import { NavLink } from "react-router-dom";

interface MenuItem {
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { label: "Users Table", path: "/UsersTable" },
  { label: "Covarage Data", path: "/Api1" },
  { label: "Mechanic Commands", path: "/Api2" },
  { label: "Cars Scans", path: "/ObdScanReport" },
  { label: "Special Function", path: "/SpecilaFunction" },
  { label: "Actuations Detail", path: "/ActuationsDetail" },
  { label: "Custom commands", path: "/Customcommands1" },
  { label: "Actuation Test", path: "/ActuationFetcher" },
  { label: "SPF Commands", path: "/CommandFetcher" },
  { label: "Model List Page", path: "/ModelListPage" },
  { label: "Bike Make List", path: "/BikeMakeList" },
  { label: "Odometer Details", path: "/OdometerDetails" },
  { label: "Live Commands", path: "/LiveDataCommands" },
  { label: "Fault Code Symptoms", path: "/FaultCodeSymptoms" },
  { label: "Fault Code Solutions", path: "/FaultCodeSolutions" },
  { label: "Fault Code Causes", path: "/FaultCodeCauses" },
  { label: "Fault Code List", path: "/FaultCodeList" },
  { label: "Update commands", path: "/Updatecommand" },
  { label: "Fault Codes Uploader", path: "/FaultCodesUploader" },
  { label: "Fault Codes Uploader 2", path: "/FaultCodesUploader2" },
  { label: "Activation Codes Uploader", path: "/ActivationCodesUploader" },
];

function Sidebar() {
  return (
    <div className="bg-gray-100 h-screen w-64 p-4 shadow-lg overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 ml-4 text-gray-800 ">DashBoard</h2>

      <div className="space-y-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg text-lg font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-700 hover:bg-blue-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;




