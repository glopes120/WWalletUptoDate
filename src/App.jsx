import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import NewLoginForm from './components/NewLoginForm';
import Dashboard from './components/dashboard.jsx';
import Sidebar from './components/Sidebar';
import UpdatePassword from './components/UpdatePassword'; // Importar o novo componente

function App() {
    const [session, setSession] = useState(null);
    const [activeMenuItem, setActiveMenuItem] = useState('Dashboard');
    const [isRecoveryMode, setIsRecoveryMode] = useState(false); // Novo estado para controlar o modo de recuperação

    useEffect(() => {
        // Obter sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Escutar alterações de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth Event:", event);
            
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecoveryMode(true); // Ativa o modo de recuperação
            }
            
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleMenuSelect = (menuItem) => {
        setActiveMenuItem(menuItem);
    };

    // Caso estejamos no modo de recuperação de password
    if (isRecoveryMode) {
        return (
            <UpdatePassword 
                onPasswordUpdated={() => {
                    setIsRecoveryMode(false); // Sai do modo de recuperação
                    // O utilizador já está logado, então irá para o Dashboard
                }} 
            />
        );
    }

    // Fluxo normal de Login
    if (!session) {
        return (
            <div className="App"> 
                {/* Nota: O layout foi movido para dentro do NewLoginForm no passo anterior para melhor controlo */}
                <NewLoginForm onLoginSuccess={(session) => setSession(session)} />
            </div>
        );
    } else {
        // Fluxo normal de Dashboard
        return (
            <div className="app-layout">
                <Sidebar onSelectMenuItem={handleMenuSelect} activeItem={activeMenuItem} user={session.user} />
                <main className="main-content">
                    <Dashboard view={activeMenuItem} setView={setActiveMenuItem} />
                </main>
            </div>
        );
    }
}

export default App;