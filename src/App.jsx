import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthProvider';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ToastProvider } from '@/context/ToastProvider';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const PlanTrip = lazy(() => import('@/pages/PlanTrip'));
const Assistant = lazy(() => import('@/pages/Assistant'));
const ExplorePlaces = lazy(() => import('@/pages/ExplorePlaces'));
const Restaurants = lazy(() => import('@/pages/Restaurants'));
const Weather = lazy(() => import('@/pages/Weather'));
const TripDetails = lazy(() => import('@/pages/TripDetails'));
const SavedTrips = lazy(() => import('@/pages/SavedTrips'));
const Profile = lazy(() => import('@/pages/Profile'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function withSuspense(Element) {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Element />
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Layout>
            <Routes>
              <Route path="/" element={withSuspense(Login)} />
              <Route path="/login" element={withSuspense(Login)} />
              <Route path="/register" element={withSuspense(Register)} />
              <Route path="/home" element={withSuspense(Landing)} />
              <Route path="/explore" element={withSuspense(ExplorePlaces)} />
              <Route path="/restaurants" element={withSuspense(Restaurants)} />
              <Route path="/weather" element={withSuspense(Weather)} />
              <Route path="/trips/:id" element={<ProtectedRoute>{withSuspense(TripDetails)}</ProtectedRoute>} />
              <Route path="/assistant" element={<ProtectedRoute>{withSuspense(Assistant)}</ProtectedRoute>} />
              <Route path="/plan" element={<ProtectedRoute>{withSuspense(PlanTrip)}</ProtectedRoute>} />
              <Route path="/trips" element={<ProtectedRoute>{withSuspense(SavedTrips)}</ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute>{withSuspense(Profile)}</ProtectedRoute>} />
              <Route path="/404" element={withSuspense(NotFound)} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Layout>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
