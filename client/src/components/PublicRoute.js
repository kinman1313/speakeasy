import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

function PublicRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/chat';

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    return children;
}

export default PublicRoute;