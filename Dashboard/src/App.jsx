import React from "react";
import { Route, Routes } from "react-router-dom";
import MainDashboard from "./pages/main-dashboard";
import ActivityLogPage from "./pages/activity-log";
import EmployeeDirectoryPage from "./pages/employee-directory";
import AllCameras from "./pages/all-cameras";
import SocketComponent from "./components/socket-component";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainDashboard />}>
          <Route path="cameras" element={<AllCameras />}></Route>
          <Route path="activity" element={<ActivityLogPage />}></Route>
          <Route path="employees" element={<EmployeeDirectoryPage />}></Route>
          <Route path="socket" element={<SocketComponent />}></Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;
