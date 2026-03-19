import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout";
import { UserProvider } from "./context/UserContext";
import Dashboard from "./pages/Dashboard";
import Invitations from "./pages/Invitations";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Project from "./pages/Project";
import TeamDetail from "./pages/TeamDetail";
import Teams from "./pages/Teams";

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
