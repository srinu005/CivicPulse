import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import UserPage from "./pages/UserPage";
import ReportsMapPage from "./pages/ReportsMapPage";
import ReportFormPage from "./pages/ReportFormPage";
import ReportDetailPage from "./pages/ReportDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/reports" element={<ReportsMapPage />} />
        <Route path="/report/new" element={<ReportFormPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;