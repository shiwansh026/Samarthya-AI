import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import StudentDashboard from './components/StudentDashboard';
import MentorDashboard from './components/MentorDashboard';
import AdminDashboard from './components/AdminDashboard';
import { getProfile } from './api';
import { ShieldAlert, CheckCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  
  // Toasts
  const [toastError, setToastError] = useState('');
  const [toastSuccess, setToastSuccess] = useState('');

  // Initial authentication check on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userProfile = await getProfile();
          setUser(userProfile);
          // Set active view based on role
          if (userProfile.role === 'admin') {
            setActiveTab('admin');
          } else if (userProfile.role === 'student') {
            setActiveTab('profile');
          } else if (userProfile.role === 'mentor') {
            setActiveTab('profile');
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setUser(null);
          setActiveTab('home');
        }
      } else {
        setActiveTab('home');
      }
      setLoading(false);
    };

    // Check for query parameters related to email verification
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const errorParam = params.get('error');

    if (verified === 'true') {
      setToastSuccess('Email verified successfully! You can now log in.');
      setShowModal('login');
      setActiveTab('home');
      // Clear query params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (verified === 'false' || errorParam === 'invalid_token') {
      setToastError('Invalid or expired email verification link.');
      setActiveTab('home');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    initAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('profile'); // Send student/mentor to profile form initially
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setActiveTab('home');
  };

  // Nav actions
  const handleNavAction = (tab) => {
    if (tab === 'login' || tab === 'signup') {
      setShowModal(tab);
      setActiveTab('home');
    } else {
      setActiveTab(tab);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 text-zinc-900">
        <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Toast notifications */}
      {toastError && (
        <div className="fixed top-20 right-6 z-50 bg-white border border-zinc-250 text-zinc-900 px-5 py-3.5 rounded-xl shadow-lg flex items-start space-x-3 text-sm max-w-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-zinc-800" />
          <div className="flex-grow">
            <span className="font-bold block">Verification Failed</span>
            <span className="text-xs text-zinc-500 block mt-0.5">{toastError}</span>
          </div>
          <button onClick={() => setToastError('')} className="text-zinc-400 hover:text-zinc-900 font-bold ml-2">×</button>
        </div>
      )}
      {toastSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-white border border-zinc-250 text-zinc-900 px-5 py-3.5 rounded-xl shadow-lg flex items-start space-x-3 text-sm max-w-sm">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-zinc-800" />
          <div className="flex-grow">
            <span className="font-bold block">Email Confirmed</span>
            <span className="text-xs text-zinc-500 block mt-0.5">{toastSuccess}</span>
          </div>
          <button onClick={() => setToastSuccess('')} className="text-zinc-400 hover:text-zinc-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={handleNavAction} 
        onLogout={handleLogout} 
      />

      {/* Main content view area */}
      <main className="flex-grow flex flex-col justify-start">
        {!user && (
          <Home 
            onLoginSuccess={handleLoginSuccess} 
            showModal={showModal} 
            setShowModal={setShowModal} 
          />
        )}
        
        {user && user.role === 'student' && (
          <StudentDashboard 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        )}
        
        {user && user.role === 'mentor' && (
          <MentorDashboard 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        )}

        {user && user.role === 'admin' && activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}
