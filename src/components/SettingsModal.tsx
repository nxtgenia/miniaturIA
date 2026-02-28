import React, { useState } from 'react';
import { X, CreditCard, User, Mail, Lock, Loader2, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/config';

interface SettingsModalProps {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
    const { user, signOut, session } = useAuth();
    const { plan, credits } = useCredits();

    const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile');
    const [name, setName] = useState(user?.user_metadata?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [billingLoading, setBillingLoading] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const updates: any = {};
            if (name !== user?.user_metadata?.full_name) {
                updates.data = { full_name: name };
            }
            if (email !== user?.email) {
                updates.email = email;
            }
            if (password) {
                updates.password = password;
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase.auth.updateUser(updates);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
                if (password) setPassword(''); // clear password field
            } else {
                setMessage({ type: 'info', text: 'No hay cambios para guardar.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error al actualizar el perfil.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerPortal = async () => {
        if (!session?.access_token) return;
        setBillingLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/customer-portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId: user?.id })
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Error al abrir el portal');
            }
        } catch (err: any) {
            alert(err.message || 'No se pudo abrir el portal de facturación.');
        } finally {
            setBillingLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#1e1e1e] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col sm:flex-row min-h-[500px]">

                {/* Sidebar */}
                <div className="w-full sm:w-64 bg-[#111] border-b sm:border-b-0 sm:border-r border-[#1e1e1e] p-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-white font-bold text-lg">Ajustes</h2>
                        <button onClick={onClose} className="sm:hidden text-[#666] hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'profile' ? 'bg-[#ff0000]/10 text-[#ff0000]' : 'text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                            }`}
                    >
                        <User className="w-4 h-4" /> Perfil y Cuenta
                    </button>

                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'billing' ? 'bg-[#ff0000]/10 text-[#ff0000]' : 'text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                            }`}
                    >
                        <CreditCard className="w-4 h-4" /> Facturación
                    </button>

                    <div className="mt-auto pt-6">
                        <button
                            onClick={signOut}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium w-full text-[#888] hover:text-red-500 hover:bg-red-500/10"
                        >
                            <LogOut className="w-4 h-4" /> Cerrar sesión
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 relative">
                    <button onClick={onClose} className="hidden sm:block absolute top-6 right-6 text-[#666] hover:text-white">
                        <X className="w-5 h-5" />
                    </button>

                    {activeTab === 'profile' && (
                        <div className="max-w-md mt-4">
                            <h3 className="text-white text-xl font-bold mb-6">Tu Perfil</h3>

                            {message.text && (
                                <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                                    message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                        'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                                        Nombre Completo
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 text-[#555]" />
                                        </div>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-[#111] border border-[#1e1e1e] focus:border-[#ff0000]/50 rounded-xl py-3 pl-10 pr-4 text-sm text-[#e4e4e7] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-[#555]" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-[#111] border border-[#1e1e1e] focus:border-[#ff0000]/50 rounded-xl py-3 pl-10 pr-4 text-sm text-[#e4e4e7] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2 mt-6">
                                        Nueva Contraseña (Opcional)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-[#555]" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Déjalo en blanco para no cambiarla"
                                            className="w-full bg-[#111] border border-[#1e1e1e] focus:border-[#ff0000]/50 rounded-xl py-3 pl-10 pr-4 text-sm text-[#e4e4e7] placeholder:text-[#444] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#ff0000] hover:bg-[#dc2626] text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Cambios'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="max-w-md mt-4">
                            <h3 className="text-white text-xl font-bold mb-6">Facturación</h3>

                            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[#888] text-sm">Plan actual</span>
                                    <span className="bg-[#ff0000]/10 text-[#ff0000] font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                                        {plan === 'free' ? 'Gratuito' : plan}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#888] text-sm">Créditos disponibles</span>
                                    <span className="text-white font-black text-xl">{credits}</span>
                                </div>
                            </div>

                            <p className="text-[#a1a1aa] text-sm mb-6 leading-relaxed">
                                A través de nuestro portal de pagos seguro (Stripe) puedes actualizar tu método de pago, descargar tus facturas, cancelar tu suscripción o cambiar de plan.
                            </p>

                            <button
                                onClick={handleCustomerPortal}
                                disabled={billingLoading}
                                className="w-full bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {billingLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-[#ff0000]" />
                                ) : (
                                    <>
                                        Gestión de Facturación <ArrowRight className="w-4 h-4 ml-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
