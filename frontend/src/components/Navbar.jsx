import React from 'react';
import { LogOut, BookOpen, Users, User as UserIcon, Shield } from 'lucide-react';

export default function Navbar({ user, activeTab, setActiveTab, onLogout }) {
  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => user ? null : setActiveTab('home')}>
          <BookOpen className="w-6 h-6 text-zinc-900" />
          <span className="font-extrabold text-2xl tracking-tight text-zinc-900">
            SAMARTHYA
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-6">
          {user && (
            <div className="flex items-center space-x-2 bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-full mr-2">
              <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
              <span className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          )}

          {user && user.role === 'student' && (
            <>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'roadmap'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Roadmap</span>
              </button>
              <button
                onClick={() => setActiveTab('mentors')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'mentors'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Mentors</span>
              </button>
            </>
          )}

          {user && user.role === 'mentor' && (
            <>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('mentors')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'mentors'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>My Sessions</span>
              </button>
            </>
          )}

          {user && user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          )}

          {user ? (
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('login')}
                className="text-zinc-600 hover:text-zinc-900 font-medium text-sm px-4 py-2 rounded-lg hover:bg-zinc-100 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className="bg-zinc-900 hover:bg-zinc-800 font-medium text-sm text-white px-5 py-2.5 rounded-lg transition-all"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
