import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CreditsProvider } from './contexts/CreditsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';

// Lazy load the application parts to improve initial Landing page load time
const Auth = lazy(() => import('./pages/Auth'));
const ChatApp = lazy(() => import('./ChatApp'));

// Fallback loader for Suspense
const Loader = () => (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff0000] border-t-transparent animate-spin"></div>
    </div>
);

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <CreditsProvider>
                    <Suspense fallback={<Loader />}>
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/app" element={
                                <ProtectedRoute>
                                    <ChatApp />
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </Suspense>
                </CreditsProvider>
            </AuthProvider>
        </Router>
    );
}
