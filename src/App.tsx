import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreditsProvider } from './contexts/CreditsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ChatApp from './ChatApp';

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <CreditsProvider>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/app" element={
                            <ProtectedRoute>
                                <ChatApp />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </CreditsProvider>
            </AuthProvider>
        </Router>
    );
}
