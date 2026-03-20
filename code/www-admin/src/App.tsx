import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout";
import PurgeButton from "./components/PurgeButton";
import AdminTeamDetail from "./pages/AdminTeamDetail";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Teams from "./pages/Teams";
import Users from "./pages/Users";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/teams/:teamId" element={<AdminTeamDetail />} />
                </Routes>
                <PurgeButton />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
