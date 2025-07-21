import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// 1. You import all your page components
import Register from './pages/Register';
import Login from './pages/Login';
import Generator from './pages/Generator';

// A special component to protect your routes
const PrivateRoute = ({ children }) => {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            {/* The <Routes> block is where you define the rules */}
            <Routes>
                {/* Rule 1: If the URL is "/login", render the Login component. */}
                <Route path="/login" element={<Login />} />

                {/* Rule 2: If the URL is "/register", render the Register component. */}
                <Route path="/register" element={<Register />} />
                
                {/* Rule 3: If the URL is "/", render the Generator component, but only if the user is logged in. */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <Generator />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;