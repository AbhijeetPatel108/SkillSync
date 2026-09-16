import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Skills from "../pages/Skills/Skills";
import Dashboard from "../pages/Dashboard/Dashboard";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Profile from "../pages/Profile/Profile";
import EditProfile from "../pages/Profile/EditProfile";
import ProtectedRoute from "./ProtectedRoute";
import Matches from "../pages/Matches/Matches";
import Reviews from "../pages/Reviews/Reviews";
import Chat from "../pages/Chat/Chat";
import Projects from "../pages/Projects/Projects";
import AdminUsers from "../pages/Admin/AdminUsers";
import MainLayout from "../layouts/MainLayout";

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedPage>
              <Dashboard />
            </ProtectedPage>
          }
        />
        <Route
          path="/skills"
          element={
            <ProtectedPage>
              <Skills />
            </ProtectedPage>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedPage>
              <Profile />
            </ProtectedPage>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedPage>
              <EditProfile />
            </ProtectedPage>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedPage>
              <Matches />
            </ProtectedPage>
          }
        />
        <Route
          path="/reviews/:userId"
          element={
            <ProtectedPage>
              <Reviews />
            </ProtectedPage>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedPage>
              <Chat />
            </ProtectedPage>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedPage>
              <Projects />
            </ProtectedPage>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedPage>
              <AdminUsers />
            </ProtectedPage>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;