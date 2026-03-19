import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { UserProvider } from "./context/UserContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Project from "./pages/Project";
import Invitations from "./pages/Invitations";
import Profile from "./pages/Profile";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
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
              <UserProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/teams/:teamId" element={<TeamDetail />} />
                    <Route path="/projects/:projectId" element={<Project />} />
                    <Route path="/invitations" element={<Invitations />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </UserProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
