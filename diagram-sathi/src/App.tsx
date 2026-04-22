import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import AuthPage from "./components/AuthComponents/AuthPage";
import Editor from "./pages/Editor";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Dashboard Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Drafts from "./pages/Drafts";
import Projects from "./pages/Projects";
import Trash from "./pages/Trash";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1725",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "13px",
          },
        }}
      />
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/drafts" element={<Drafts />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/trash" element={<Trash />} />
          </Route>

          {/* Editor Route (Standalone fullscreen, no sidebar) */}
          <Route
            path="/editor/:id"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
