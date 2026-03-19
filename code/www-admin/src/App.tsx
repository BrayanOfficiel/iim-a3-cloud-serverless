import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Teams from "./pages/Teams";
import AdminTeamDetail from "./pages/AdminTeamDetail";

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
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
