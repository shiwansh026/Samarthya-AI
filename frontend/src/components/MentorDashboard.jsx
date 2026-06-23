import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Calendar, Clock, BookOpen, CheckCircle, 
  AlertCircle, ShieldCheck, XCircle, Award, CheckCircle2
} from 'lucide-react';
import { 
  getProfile, updateMentorProfile, getSessions, 
  confirmSession, cancelSession, completeSession 
} from '../api';

export default function MentorDashboard({ activeTab, setActiveTab }) {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    specialization: '',
    bio: '',
    experience_years: '',
    education: '',
    hourly_rate: ''
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const userProfile = await getProfile();
      setProfile(userProfile);
      
      const mProfile = userProfile.profile || {};
      setProfileForm({
        specialization: mProfile.specialization || '',
        bio: mProfile.bio || '',
        experience_years: mProfile.experience_years !== null ? mProfile.experience_years : '',
        education: mProfile.education || '',
        hourly_rate: mProfile.hourly_rate !== null ? parseFloat(mProfile.hourly_rate).toFixed(0) : ''
      });

      // Get Sessions
      const sList = await getSessions();
      setSessions(sList);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const parsedExp = profileForm.experience_years ? parseInt(profileForm.experience_years) : null;
      const parsedRate = profileForm.hourly_rate ? parseFloat(profileForm.hourly_rate) : null;
      await updateMentorProfile({
        ...profileForm,
        experience_years: parsedExp,
        hourly_rate: parsedRate
      });
      setSuccess('Profile updated successfully.');
      // Refresh profile data
      const userProfile = await getProfile();
      setProfile(userProfile);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Session Actions (Confirm / Cancel / Complete)
  const handleSessionAction = async (sessionId, actionType) => {
    setError('');
    setSuccess('');
    // Mark specific action as loading
    setActionLoading({ ...actionLoading, [sessionId]: actionType });
    try {
      let updatedSession;
      if (actionType === 'confirm') {
        updatedSession = await confirmSession(sessionId);
        setSuccess('Session confirmed successfully.');
      } else if (actionType === 'cancel') {
        updatedSession = await cancelSession(sessionId);
        setSuccess('Session cancelled successfully.');
      } else if (actionType === 'complete') {
        updatedSession = await completeSession(sessionId);
        setSuccess('Session marked as completed.');
      }
      
      // Update session locally in state
      setSessions(sessions.map(s => s.id === sessionId ? updatedSession : s));
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${actionType} session.`);
    } finally {
      setActionLoading({ ...actionLoading, [sessionId]: null });
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-left">
      {/* Alert banners */}
      {error && (
        <div className="bg-zinc-50 border border-zinc-200 text-zinc-900 px-4 py-3 rounded-xl mb-6 flex items-start space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-zinc-50 border border-zinc-200 text-zinc-900 px-4 py-3 rounded-xl mb-6 flex items-start space-x-2 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 glass-card p-8 rounded-2xl">
            <h2 className="text-2xl font-black mb-6 text-zinc-900 flex items-center space-x-2">
              <UserIcon className="w-6 h-6 text-zinc-900" />
              <span>Mentor Profile Details</span>
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                    placeholder="E.g. Computer Science, Careers in Law"
                    required
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="experience_years"
                    value={profileForm.experience_years}
                    onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })}
                    placeholder="E.g. 5"
                    required
                    min="0"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Provide a summary of your career journey and how you counsel students..."
                  required
                  rows={4}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Education Background</label>
                  <input
                    type="text"
                    name="education"
                    value={profileForm.education}
                    onChange={(e) => setProfileForm({ ...profileForm, education: e.target.value })}
                    placeholder="E.g. B.Tech in CSE from IIT Delhi"
                    required
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Hourly Rate (₹ INR)</label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={profileForm.hourly_rate}
                    onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })}
                    placeholder="E.g. 500"
                    required
                    min="0"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-all"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Verification status badge */}
          <div className="space-y-6">
            <div className="glass-card p-8 rounded-2xl text-center flex flex-col items-center bg-white border border-zinc-200">
              <Award className="w-16 h-16 text-zinc-900 mb-4" />
              <h3 className="text-lg font-bold mb-2 text-zinc-900">Verification Status</h3>
              
              {profile?.profile?.is_verified ? (
                <div className="inline-flex items-center space-x-2 bg-zinc-100 border border-zinc-200 text-zinc-800 px-4 py-2 rounded-full font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verified Mentor</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 bg-zinc-50 border border-zinc-200 text-zinc-500 px-4 py-2 rounded-full font-semibold text-sm">
                  <span>Pending Admin Verification</span>
                </div>
              )}

              <p className="text-xs text-zinc-500 mt-6 leading-relaxed">
                Only verified mentors are displayed to students in the discover dashboard. Your profile verification is managed by administrators.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mentors' && (
        <div>
          <h2 className="text-2xl font-black mb-6 text-zinc-900 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-zinc-900" />
            <span>Consultation Session Bookings</span>
          </h2>
          
          {sessions.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-zinc-500 bg-white border border-zinc-200">
              No students have booked sessions with you yet.
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-550">
                  <thead className="bg-zinc-50 text-zinc-700 border-b border-zinc-200 uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Scheduled Date</th>
                      <th className="px-6 py-4">Topic & Description</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {sessions.map(s => {
                      const isPending = s.status === 'pending';
                      const isConfirmed = s.status === 'confirmed';
                      const isLoading = actionLoading[s.id];

                      return (
                        <tr key={s.id} className="hover:bg-zinc-50/50 transition-all">
                          <td className="px-6 py-4 font-bold text-zinc-900">{s.student_name}</td>
                          <td className="px-6 py-4 text-xs font-mono text-zinc-650">{s.student_email}</td>
                          <td className="px-6 py-4 text-xs font-mono text-zinc-650">
                            {new Date(s.scheduled_date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <span className="font-semibold text-zinc-805 block">{s.topic}</span>
                            <span className="text-xs text-zinc-500 line-clamp-2 mt-1">{s.description}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              s.status === 'confirmed'
                                ? 'bg-zinc-100 border-zinc-200 text-zinc-800'
                                : s.status === 'pending'
                                ? 'bg-zinc-50 border-zinc-200 text-zinc-500'
                                : s.status === 'cancelled'
                                ? 'bg-zinc-50 border-zinc-200 text-zinc-400 line-through'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-450'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleSessionAction(s.id, 'confirm')}
                                    disabled={!!isLoading}
                                    className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    {isLoading === 'confirm' ? '...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => handleSessionAction(s.id, 'cancel')}
                                    disabled={!!isLoading}
                                    className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    {isLoading === 'cancel' ? '...' : 'Decline'}
                                  </button>
                                </>
                              )}
                              {isConfirmed && (
                                <>
                                  <button
                                    onClick={() => handleSessionAction(s.id, 'complete')}
                                    disabled={!!isLoading}
                                    className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    {isLoading === 'complete' ? '...' : 'Complete'}
                                  </button>
                                  <button
                                    onClick={() => handleSessionAction(s.id, 'cancel')}
                                    disabled={!!isLoading}
                                    className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    {isLoading === 'cancel' ? '...' : 'Cancel'}
                                  </button>
                                </>
                              )}
                              {!isPending && !isConfirmed && (
                                <span className="text-xs text-zinc-400">Read-Only</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
