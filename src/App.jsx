


import React, { useState, useEffect } from 'react';

import './App.css';

import { supabase } from './supabaseClient';

import NewLoginForm from './components/NewLoginForm';

import Dashboard from './components/dashboard.jsx';

import Sidebar from './components/Sidebar'; // Import the new Sidebar



function App() {

    const [session, setSession] = useState(null);

    const [activeMenuItem, setActiveMenuItem] = useState('Dashboard'); // Initial view



    useEffect(() => {

        supabase.auth.getSession().then(({ data: { session } }) => {

            setSession(session);

        });



        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {

            setSession(session);

        });



        return () => subscription.unsubscribe();

    }, []);



    const handleMenuSelect = (menuItem) => {

        setActiveMenuItem(menuItem);

    };



    if (!session) {

        return (

            <div className="App"> 

                <div className="left-side">

                    <NewLoginForm onLoginSuccess={(session) => setSession(session)} />

                </div>

                <div className="right-side">

                    <h1 className="app-title">WiseWallet</h1>

                    <p className="app-description">A minha app de gestão de despesas!</p>

                </div>

            </div>

        );

    } else {

        return (

            <div className="app-layout">

                <Sidebar onSelectMenuItem={handleMenuSelect} activeItem={activeMenuItem} user={session.user} />

                <main className="main-content">

                    {/* The Dashboard component will now act as the content area */}

                    <Dashboard view={activeMenuItem} setView={setActiveMenuItem} />

                </main>

            </div>

        );

    }

}



export default App;
