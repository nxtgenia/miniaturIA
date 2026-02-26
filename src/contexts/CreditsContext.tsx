import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CreditsContextType {
    credits: number;
    plan: string;
    loading: boolean;
    useCredits: (amount?: number) => Promise<{ success: boolean; error?: string }>;
    refreshCredits: () => Promise<void>;
    hasEnoughCredits: (amount?: number) => boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const useCredits = () => {
    const context = useContext(CreditsContext);
    if (!context) throw new Error('useCredits must be used within CreditsProvider');
    return context;
};

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [credits, setCredits] = useState(0);
    const [plan, setPlan] = useState('free');
    const [loading, setLoading] = useState(true);

    const refreshCredits = useCallback(async () => {
        if (!user) {
            setCredits(0);
            setPlan('free');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('credits, plan')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching credits:', error);
                return;
            }

            if (data) {
                setCredits(data.credits);
                setPlan(data.plan || 'free');
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshCredits();
    }, [refreshCredits]);

    const useCreditsFunc = async (amount: number = 10): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'No autenticado' };

        try {
            const { data, error } = await supabase.rpc('use_credits', {
                amount,
                description: 'Generación de miniatura',
            });

            if (error) {
                console.error('RPC error:', error);
                return { success: false, error: 'Error al procesar créditos' };
            }

            if (data?.success) {
                setCredits(data.credits);
                return { success: true };
            } else {
                return { success: false, error: data?.error || 'Créditos insuficientes' };
            }
        } catch (err) {
            console.error('Error using credits:', err);
            return { success: false, error: 'Error de conexión' };
        }
    };

    const hasEnoughCredits = (amount: number = 10) => credits >= amount;

    return (
        <CreditsContext.Provider value={{
            credits,
            plan,
            loading,
            useCredits: useCreditsFunc,
            refreshCredits,
            hasEnoughCredits,
        }}>
            {children}
        </CreditsContext.Provider>
    );
};
