
import Sidebar from './Sidebar'; 
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="flex">
     
      <div className="hidden lg:block bg-gray-200 w-52 fixed h-screen">
        <Sidebar />
      </div>

    
      <div className="ml-0 md:ml-52 flex flex-col min-h-screen w-full">
        {/* Main Content */}
        <div className="flex-grow p-4">
          <Outlet />
        </div>

       
        
      </div>
    </div>
  );
}

export default Layout;