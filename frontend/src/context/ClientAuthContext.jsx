import React, { createContext, useContext, useState, useEffect } from 'react';
import { clientAPI } from '../services/api';

const ClientAuthContext = createContext();

export const useClientAuth = () => {
    const context = useContext(ClientAuthContext);
    if (!context) {
        throw new Error('useClientAuth must be used within a ClientAuthProvider');
    }
    return context;
};

export const ClientAuthProvider = ({ children }) => {
    const [client, setClient] = useState(() => {
        try {
            const saved = localStorage.getItem('clientData');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('clientToken'));

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            setLoading(true);
            const response = await clientAPI.checkAuth();
            if (response.data.authenticated && response.data.client) {
                setClient(response.data.client);
                setIsAuthenticated(true);
                // If backend returns a fresh token, ensure it's used
                try {
                    const token = response.data.token || response.data.client?.token;
                    if (token) {
                        const { setAuthToken } = require('../services/api');
                        setAuthToken(token);
                    }
                } catch (e) {}
            } else {
                setClient(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            // Don't log 401 errors as they are expected when not authenticated
            if (error.response?.status !== 401) {
                console.error('Auth check error:', error);
            }
            setClient(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const loginData = {
                email,
                mot_de_passe: password
            };
            
            const response = await clientAPI.login(loginData);
            
            if (response.data.client) {
                    setClient(response.data.client);
                    setIsAuthenticated(true);
                    // Persist token and client data
                    const token = response.data.token || response.data.client?.token;
                    if (token) {
                        try { const { setAuthToken } = require('../services/api'); setAuthToken(token); } catch(e){}
                    }
                    try { localStorage.setItem('clientData', JSON.stringify(response.data.client)); } catch(e){}
                return { success: true, message: response.data.message };
            }
            
            return { success: false, message: 'Erreur de connexion' };
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur de connexion';
            return { success: false, message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await clientAPI.register(userData);
            return { 
                success: true, 
                message: response.data.message,
                clientId: response.data.clientId,
                verificationToken: response.data.verificationToken
            };
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await clientAPI.logout();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            setClient(null);
            setIsAuthenticated(false);
                // Clear persisted auth and axios header
                try { const { clearAuthToken } = require('../services/api'); clearAuthToken(); } catch(e){}
                try { localStorage.removeItem('clientData'); } catch(e){}
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await clientAPI.updateProfile(profileData);
            
            // Refresh client data after successful update
            await checkAuthStatus();
            
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de la mise à jour du profil';
            return { success: false, message };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const response = await clientAPI.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
            return { success: false, message };
        }
    };

    const verifyEmail = async (token) => {
        try {
            const response = await clientAPI.verifyEmail(token);
            
            // Refresh client data after email verification
            await checkAuthStatus();
            
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.message || 'Erreur lors de la vérification de l\'email';
            return { success: false, message };
        }
    };

    const refreshAuth = async () => {
        await checkAuthStatus();
    };

    const value = {
        client,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        verifyEmail,
        forgotPassword: async (email) => {
            try {
                const response = await clientAPI.forgotPassword(email);
                return { success: true, message: response.data.message };
            } catch (error) {
                const message = error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email';
                return { success: false, message };
            }
        },
        resetPassword: async (token, newPassword) => {
            try {
                const response = await clientAPI.resetPassword(token, newPassword);
                return { success: true, message: response.data.message };
            } catch (error) {
                const message = error.response?.data?.message || 'Erreur lors de la réinitialisation';
                return { success: false, message };
            }
        },
        verifyResetToken: async (token) => {
            try {
                const response = await clientAPI.verifyResetToken(token);
                return { valid: response.data.valid, message: response.data.message };
            } catch (error) {
                return { valid: false, message: 'Erreur lors de la vérification' };
            }
        },
        refreshAuth,
        checkAuthStatus
    };

    return (
        <ClientAuthContext.Provider value={value}>
            {children}
        </ClientAuthContext.Provider>
    );
};

export default ClientAuthContext;
