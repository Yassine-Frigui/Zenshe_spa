import React, { createContext, useContext, useState, useEffect } from 'react';
import { clientAPI } from '../services/api';
import { useClientAuth } from '../context/ClientAuthContext';

const MembershipContext = createContext();

export const useMembership = () => {
    const context = useContext(MembershipContext);
    if (!context) {
        throw new Error('useMembership must be used within MembershipProvider');
    }
    return context;
};

export const MembershipProvider = ({ children }) => {
    const [activeMembership, setActiveMembership] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Use ClientAuthContext for canonical auth state (persists across refresh)
    const { isAuthenticated: clientIsAuthenticated, client } = useClientAuth();

    const fetchActiveMembership = async () => {
        if (!isAuthenticated()) {
            setActiveMembership(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await clientAPI.getActiveMembership();
            
            if (response.data.success) {
                setActiveMembership(response.data.data);
            } else {
                setActiveMembership(null);
            }
        } catch (err) {
            console.error('Error fetching membership:', err);
            setError(err.message);
            setActiveMembership(null);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch when client auth status becomes authenticated
    useEffect(() => {
        if (clientIsAuthenticated) {
            fetchActiveMembership();
        } else {
            // Clear membership when logged out
            setActiveMembership(null);
        }
    }, [clientIsAuthenticated]);

    const hasActiveMembership = () => {
        return activeMembership && 
               activeMembership.services_restants > 0 &&
               activeMembership.statut === 'active';
    };

    const refreshMembership = () => {
        return fetchActiveMembership();
    };

    return (
        <MembershipContext.Provider value={{
            activeMembership,
            hasActiveMembership,
            loading,
            error,
            refreshMembership,
            // Expose auth boolean coming from ClientAuthContext
            isAuthenticated: !!clientIsAuthenticated
        }}>
            {children}
        </MembershipContext.Provider>
    );
};
