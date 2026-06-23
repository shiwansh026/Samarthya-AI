import React, { useState } from 'react';
import { BookOpen, Users, Compass, CheckCircle2, ArrowRight, Lock, Mail, User, ShieldAlert } from 'lucide-react';
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, getProfile } from '../api';

export default function Home({ onLoginSuccess, showModal, setShowModal }) {
  const [isRegister, setIsRegister] = useState(showModal === 'signup');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student'
    });
    setError('');
    setSuccessMsg('');
    setNeedsVerification(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Validation (UX only, backend revalidates)
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match.");
          setLoading(false);
          return;
        }

        const data = await apiRegister(
          formData.firstName,
          formData.lastName,
          formData.email,
          formData.password,
          formData.confirmPassword,
          formData.role
        );
        
        setSuccessMsg(data.message);
        setNeedsVerification(true);
      } else {
        await apiLogin(formData.email, formData.password);
        // JWT login only returns tokens, so fetch user profile separately
        const userProfile = await getProfile();
        onLoginSuccess(userProfile);
        setShowModal(null);
        resetForm();
      }
    } catch (err) {
      console.error('Login/Register error:', err);
      const respData = err.response?.data;
      if (respData) {
        // Extract specific field errors or general detail error
        if (typeof respData.detail === 'string') {
          setError(respData.detail);
        } else if (respData.detail && typeof respData.detail === 'object') {
          // detail can be a dict when ValidationError wraps it
          const msgs = Object.values(respData.detail).flat();
          setError(msgs.join(' '));
        } else if (respData.non_field_errors) {
          setError(Array.isArray(respData.non_field_errors) ? respData.non_field_errors.join(' ') : respData.non_field_errors);
        } else {
          // Flatten dictionary errors
          const errorStrings = Object.entries(respData).map(([key, val]) => {
            const field = key.replace('_', ' ');
            const msg = Array.isArray(val) ? val.join(' ') : (typeof val === 'object' ? JSON.stringify(val) : val);
            return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${msg}`;
          });
          setError(errorStrings.join(' | '));
        }
      } else {
        setError(err.message || 'Network connection failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth flow / Mock OAuth for local testing
  const handleGoogleLogin = async (mockRole = null) => {
    setError('');
    setLoading(true);
    try {
      // In local dev we use the mock_role param if requested
      await apiGoogleLogin(null, formData.role, mockRole);
      // Fetch user profile after token is stored
      const userProfile = await getProfile();
      onLoginSuccess(userProfile);
      setShowModal(null);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-zinc-900 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center flex-grow flex flex-col justify-center items-center">
        <div className="inline-flex items-center space-x-2 bg-zinc-100 border border-zinc-200 px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
          <span className="text-xs font-semibold text-zinc-700">Empowering Grade 8-12 Students</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] max-w-4xl text-zinc-900">
          Navigate Your Career Journey with{' '}
          <span className="text-zinc-550 italic font-medium">
            AI Precision
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-550 max-w-2xl mb-12 leading-relaxed">
          Samarthya AI combines advanced AI career roadmapping with professional mentor counselling sessions to pave a clear, actionable path to your dream future.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-20">
          <button
            onClick={() => {
              setIsRegister(true);
              setShowModal('signup');
            }}
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-8 py-4 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 group text-base"
          >
            <span>Start Free Journey</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => {
              setIsRegister(false);
              setShowModal('login');
            }}
            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold px-8 py-4 rounded-xl transition-all text-base"
          >
            Schedule Consultation
          </button>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl mt-8">
          <div className="glass-card p-8 rounded-2xl text-left border border-zinc-200 bg-white">
            <div className="bg-zinc-100 border border-zinc-200 p-4 rounded-xl text-zinc-900 w-fit mb-6">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-900">AI-Generated Roadmap</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Get an interactive career plan with 8-10 customized milestones built around your specific school grade, strengths, goals, and interests.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl text-left border border-zinc-200 bg-white">
            <div className="bg-zinc-100 border border-zinc-200 p-4 rounded-xl text-zinc-900 w-fit mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-900">Milestone Tracking</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Mark milestones complete, track your learning progress with a dynamic progress bar, and regenerate your plans as your goals evolve.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl text-left border border-zinc-200 bg-white">
            <div className="bg-zinc-100 border border-zinc-200 p-4 rounded-xl text-zinc-900 w-fit mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-900">Mentor Discovery & Booking</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Browse verified counselling mentors specializing in engineering, humanities, business, design, and more, and book custom sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 px-6 text-center text-zinc-400 text-sm bg-white mt-12">
        &copy; {new Date().getFullYear()} Samarthya AI Career Platform. Developed in pair programming for MVP build. All rights reserved.
      </footer>

      {/* Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => { setShowModal(null); resetForm(); }}></div>
          
          {/* Form Card */}
          <div className="bg-white max-w-md w-full rounded-2xl border border-zinc-200 shadow-xl relative z-10 p-8 transform transition-all duration-300">
            {/* Modal Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-zinc-900">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                {isRegister ? 'Sign up to build your roadmap' : 'Enter details to access your dashboard'}
              </p>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="bg-zinc-50 border border-zinc-200 text-zinc-800 px-4 py-3 rounded-xl mb-6 flex items-start space-x-2 text-xs">
                <ShieldAlert className="w-4.5 h-4.5 text-zinc-700 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {needsVerification ? (
              /* Success Email Verification Notice State */
              <div className="text-center py-6">
                <div className="bg-zinc-100 border border-zinc-200 text-zinc-900 p-4 rounded-full w-fit mx-auto mb-6">
                  <Mail className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 mb-2">Check Your Terminal Console!</h4>
                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                  We've printed the email verification link to the local backend terminal. Please click it to verify your account, then sign in below.
                </p>
                <button
                  onClick={() => {
                    setIsRegister(false);
                    setNeedsVerification(false);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl shadow-sm transition-all"
                >
                  Proceed to Sign In
                </button>
              </div>
            ) : (
              /* Auth Forms */
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    {/* Role Select */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        I am a:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, role: 'student' })}
                          className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                            formData.role === 'student'
                              ? 'bg-zinc-900 border-zinc-900 text-white'
                              : 'bg-white border-zinc-200 text-zinc-650 hover:border-zinc-300'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, role: 'mentor' })}
                          className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                            formData.role === 'mentor'
                              ? 'bg-zinc-900 border-zinc-900 text-white'
                              : 'bg-white border-zinc-200 text-zinc-650 hover:border-zinc-300'
                          }`}
                        >
                          Mentor
                        </button>
                      </div>
                    </div>

                    {/* First & Last Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-all"
                  />
                </div>

                {isRegister && (
                  /* Confirm Password */
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-all"
                    />
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Lock className="w-4.5 h-4.5" />
                      <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6 flex items-center">
                  <div className="flex-grow border-t border-zinc-200"></div>
                  <span className="flex-shrink mx-4 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                    Or Continue With
                  </span>
                  <div className="flex-grow border-t border-zinc-200"></div>
                </div>

                {/* Google Sign-in Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin('student')}
                    className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs font-semibold hover:border-zinc-305 transition-all text-zinc-800"
                  >
                    <span>Google Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin('mentor')}
                    className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs font-semibold hover:border-zinc-305 transition-all text-zinc-800"
                  >
                    <span>Google Mentor</span>
                  </button>
                </div>

                {/* Mode toggle */}
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-950 font-bold decoration-zinc-450 hover:underline"
                  >
                    {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
