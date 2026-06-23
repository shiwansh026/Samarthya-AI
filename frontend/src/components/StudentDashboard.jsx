import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Calendar, Clock, BookOpen, Users, Compass, 
  CheckCircle, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, Plus, Info
} from 'lucide-react';
import { 
  getProfile, updateStudentProfile, generateRoadmap, getRoadmap, 
  completeMilestone, regenerateRoadmap, getMentors, bookSession, getSessions 
} from '../api';

const PREDEFINED_SKILLS = [
  'Coding', 'Public Speaking', 'Writing', 'Math', 'Design', 
  'Leadership', 'Research', 'Problem Solving', 'Teamwork', 'Creativity'
];

export default function StudentDashboard({ activeTab, setActiveTab }) {
  const [profile, setProfile] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    grade: '',
    dob: '',
    school_name: '',
    interests: '',
    strengths: '',
    goals: '',
    preferred_career_fields: '',
    skills: []
  });
  
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    mentor: '',
    date: '',
    time: '',
    topic: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const userProfile = await getProfile();
      setProfile(userProfile);
      
      const sProfile = userProfile.profile || {};
      setProfileForm({
        grade: sProfile.grade || '',
        dob: sProfile.dob || '',
        school_name: sProfile.school_name || '',
        interests: sProfile.interests || '',
        strengths: sProfile.strengths || '',
        goals: sProfile.goals || '',
        preferred_career_fields: sProfile.preferred_career_fields || '',
        skills: sProfile.skills || []
      });

      // Get Roadmap
      try {
        const rm = await getRoadmap();
        setRoadmap(rm);
      } catch (rmErr) {
        if (rmErr.response?.status !== 404) {
          console.error("Roadmap fetch error:", rmErr);
        }
      }

      // Get Mentors
      const mList = await getMentors();
      setMentors(mList);

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
      const parsedGrade = profileForm.grade ? parseInt(profileForm.grade) : null;
      const updatedProfile = await updateStudentProfile({
        ...profileForm,
        grade: parsedGrade
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

  const handleSkillToggle = (skill) => {
    const currentSkills = [...profileForm.skills];
    const index = currentSkills.indexOf(skill);
    if (index > -1) {
      currentSkills.splice(index, 1);
    } else {
      currentSkills.push(skill);
    }
    setProfileForm({ ...profileForm, skills: currentSkills });
  };

  // Roadmap Gen
  const handleGenerateRoadmap = async () => {
    setError('');
    setGenerating(true);
    try {
      const rm = await generateRoadmap();
      setRoadmap(rm);
      setSuccess('Career roadmap generated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'AI roadmap generation failed. Make sure your profile has Grade and Skills configured.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateRoadmap = async () => {
    if (!window.confirm("Are you sure you want to regenerate your roadmap? This will delete your current milestone progress.")) {
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const rm = await regenerateRoadmap();
      setRoadmap(rm);
      setSuccess('Roadmap regenerated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Roadmap regeneration failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteMilestone = async (id) => {
    try {
      const rm = await completeMilestone(id);
      setRoadmap(rm);
    } catch (err) {
      setError('Failed to update milestone status.');
    }
  };

  // Booking Save
  const handleBookSession = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const scheduledDateTime = `${bookingForm.date}T${bookingForm.time}:00Z`;
      await bookSession(
        selectedMentor.user_details.id,
        scheduledDateTime,
        bookingForm.topic,
        bookingForm.description
      );
      setSuccess('Session booked successfully. Awaiting mentor confirmation.');
      setShowBookingModal(false);
      setBookingForm({
        mentor: '',
        date: '',
        time: '',
        topic: '',
        description: ''
      });
      // Refresh sessions list
      const sList = await getSessions();
      setSessions(sList);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book session.');
    } finally {
      setLoading(false);
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
              <span>Student Profile Details</span>
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Grade</label>
                  <select
                    name="grade"
                    value={profileForm.grade}
                    onChange={(e) => setProfileForm({ ...profileForm, grade: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  >
                    <option value="">Select Grade</option>
                    {[8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={profileForm.dob}
                    onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">School Name</label>
                <input
                  type="text"
                  name="school_name"
                  value={profileForm.school_name}
                  onChange={(e) => setProfileForm({ ...profileForm, school_name: e.target.value })}
                  placeholder="Enter school name"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Interests</label>
                  <textarea
                    name="interests"
                    value={profileForm.interests}
                    onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                    placeholder="E.g. Computer games, building websites, physics"
                    rows={3}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Strengths</label>
                  <textarea
                    name="strengths"
                    value={profileForm.strengths}
                    onChange={(e) => setProfileForm({ ...profileForm, strengths: e.target.value })}
                    placeholder="E.g. Analytical thinking, good with numbers, quick learner"
                    rows={3}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Goals</label>
                  <textarea
                    name="goals"
                    value={profileForm.goals}
                    onChange={(e) => setProfileForm({ ...profileForm, goals: e.target.value })}
                    placeholder="E.g. Become a software engineer at a top tech firm"
                    rows={3}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Preferred Career Fields</label>
                  <textarea
                    name="preferred_career_fields"
                    value={profileForm.preferred_career_fields}
                    onChange={(e) => setProfileForm({ ...profileForm, preferred_career_fields: e.target.value })}
                    placeholder="E.g. Software Engineering, AI & Robotics"
                    rows={3}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              {/* Predefined Skills List */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Skills (Select multiple)</label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_SKILLS.map(skill => {
                    const isSelected = profileForm.skills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
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

          {/* Progress panel */}
          <div className="space-y-6">
            <div className="glass-card p-8 rounded-2xl text-center bg-white border border-zinc-200">
              <h3 className="text-lg font-bold mb-4 text-zinc-900">Profile Completion</h3>
              
              {/* Radial or linear progress bar */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold inline-block text-zinc-900">
                      {profile?.profile?.completion_percentage || 0}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-full bg-zinc-200">
                  <div 
                    style={{ width: `${profile?.profile?.completion_percentage || 0}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-zinc-900 transition-all duration-500"
                  ></div>
                </div>
              </div>

              {profile?.profile?.completion_percentage >= 50 ? (
                <div className="mt-8 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                  <p className="text-xs text-zinc-650 mb-4 leading-relaxed">
                    Great! Your profile is detailed enough to create an AI Career Roadmap.
                  </p>
                  <button
                    onClick={() => setActiveTab('roadmap')}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <span>Go to Roadmap</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-6 bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-left flex items-start space-x-2 text-xs text-zinc-500">
                  <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <span>Please fill out Grade, School, interests, and select skills to reach at least 50% completion.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="max-w-4xl mx-auto">
          {generating ? (
            /* Generating state loader */
            <div className="glass-card p-12 rounded-2xl text-center my-12 bg-white border border-zinc-200">
              <div className="w-16 h-16 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-2xl font-black text-zinc-900 mb-2">Generating Personalized Roadmap...</h3>
              <p className="text-sm text-zinc-550">
                Our local AI model is analyzing your strengths and preferences. This may take 5-15 seconds. Please do not close this window.
              </p>
            </div>
          ) : !roadmap ? (
            /* Empty state */
            <div className="glass-card p-12 rounded-2xl text-center my-12 bg-white border border-zinc-200">
              <Compass className="w-16 h-16 text-zinc-900 mx-auto mb-6 animate-pulse-subtle" />
              <h3 className="text-2xl font-black text-zinc-900 mb-2">No Roadmap Found</h3>
              <p className="text-sm text-zinc-500 mb-8 max-w-md mx-auto">
                Generate an AI-powered learning path with 8-10 customized milestones tailored to your high school profile.
              </p>
              <button
                onClick={handleGenerateRoadmap}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-8 py-3.5 rounded-xl shadow-sm transition-all"
              >
                Generate My Roadmap
              </button>
            </div>
          ) : (
            /* Loaded State */
            <div className="space-y-8">
              <div className="glass-card p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-zinc-200">
                <div>
                  <div className="bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider font-semibold">
                    {roadmap.career_field}
                  </div>
                  <h2 className="text-3xl font-black text-zinc-900">{roadmap.title}</h2>
                  <p className="text-zinc-550 text-sm mt-2 max-w-xl leading-relaxed">{roadmap.description}</p>
                </div>
                <div className="text-center md:text-right shrink-0">
                  <span className="text-sm font-semibold text-zinc-400 block mb-1">Roadmap Progress</span>
                  <span className="text-3xl font-black text-zinc-900">{roadmap.progress_percentage}%</span>
                  <div className="w-36 h-2 bg-zinc-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-zinc-900 h-full rounded-full transition-all duration-300"
                      style={{ width: `${roadmap.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Milestones timeline */}
              <div className="relative border-l-2 border-zinc-200 ml-4 md:ml-8 space-y-8">
                {roadmap.milestones.map((ms, index) => (
                  <div key={ms.id} className="relative pl-8 md:pl-12">
                    {/* Circle icon */}
                    <button
                      onClick={() => handleCompleteMilestone(ms.id)}
                      className={`absolute left-0 transform -translate-x-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        ms.is_completed
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm'
                          : 'bg-white border-zinc-200 text-zinc-450 hover:border-zinc-900 hover:text-zinc-900'
                      }`}
                    >
                      {ms.is_completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </button>

                    {/* Content Card */}
                    <div className={`glass-card p-6 rounded-2xl bg-white border border-zinc-200 ${ms.is_completed ? 'opacity-75' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <h4 className="text-lg font-bold text-zinc-900">{ms.title}</h4>
                        {ms.estimated_duration && (
                          <span className="text-xs bg-zinc-100 text-zinc-650 px-3 py-1 rounded-full border border-zinc-200 w-fit">
                            Duration: {ms.estimated_duration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-550 leading-relaxed mb-4">{ms.description}</p>
                      
                      {ms.resources && (
                        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-xs">
                          <span className="font-bold text-zinc-700 block mb-1">Suggested Resources:</span>
                          <span className="text-zinc-500">{ms.resources}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleRegenerateRoadmap}
                  className="flex items-center space-x-2 text-sm text-zinc-600 hover:text-zinc-900 transition-all bg-white hover:bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Regenerate Roadmap</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mentors' && (
        <div className="space-y-12">
          {/* Mentors Search grid */}
          <div>
            <h2 className="text-2xl font-black mb-6 text-zinc-900 flex items-center space-x-2">
              <Users className="w-6 h-6 text-zinc-900" />
              <span>Available Counselling Mentors</span>
            </h2>
            {mentors.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center text-zinc-400 bg-white border border-zinc-200">
                No mentors are registered and verified yet. Please check back later.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map(m => (
                  <div key={m.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between bg-white border border-zinc-200">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-zinc-900">
                            {m.user_details.first_name} {m.user_details.last_name}
                          </h3>
                          <span className="text-xs text-zinc-700 font-semibold uppercase tracking-wider block mt-1">
                            {m.specialization}
                          </span>
                        </div>
                        {m.is_verified && (
                          <div className="bg-zinc-100 border border-zinc-200 text-zinc-800 p-1.5 rounded-full text-xs" title="Verified by Administrator">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-zinc-550 mt-4 line-clamp-3 leading-relaxed">{m.bio}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6 bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs text-zinc-500">
                        <div>
                          <span className="block font-semibold text-zinc-800">Experience</span>
                          <span>{m.experience_years} years</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-zinc-800">Hourly Rate</span>
                          <span className="text-zinc-900 font-bold">₹{parseFloat(m.hourly_rate).toFixed(0)}/hr</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedMentor(m);
                        setShowBookingModal(true);
                      }}
                      className="w-full mt-6 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2 rounded-xl text-sm transition-all shadow-sm"
                    >
                      Book Free Session
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings history */}
          <div>
            <h2 className="text-2xl font-black mb-6 text-zinc-900 flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-zinc-900" />
              <span>My Counselling Bookings</span>
            </h2>
            {sessions.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center text-zinc-500 bg-white border border-zinc-200">
                You have not booked any counselling sessions yet.
              </div>
            ) : (
              <div className="glass-card overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-zinc-500">
                    <thead className="bg-zinc-50 text-zinc-700 border-b border-zinc-200 uppercase text-xs font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Mentor Name</th>
                        <th className="px-6 py-4">Field</th>
                        <th className="px-6 py-4">Scheduled Date</th>
                        <th className="px-6 py-4">Topic</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {sessions.map(s => (
                        <tr key={s.id} className="hover:bg-zinc-50/50 transition-all">
                          <td className="px-6 py-4 font-bold text-zinc-900">{s.mentor_name}</td>
                          <td className="px-6 py-4 text-xs">{s.mentor_specialization}</td>
                          <td className="px-6 py-4 text-xs font-mono text-zinc-650">
                            {new Date(s.scheduled_date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-medium text-zinc-700">{s.topic}</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingModal && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowBookingModal(false)}></div>
          <div className="bg-white max-w-md w-full rounded-2xl border border-zinc-200 p-8 relative z-10 shadow-xl">
            <h3 className="text-2xl font-black mb-2 text-zinc-900">Book Career Consultation</h3>
            <p className="text-xs text-zinc-500 mb-6">
              Book a session with <span className="text-zinc-900 font-bold">{selectedMentor.user_details.first_name} {selectedMentor.user_details.last_name}</span> (₹{parseFloat(selectedMentor.hourly_rate).toFixed(0)}/hr - waived for student MVP trial).
            </p>

            <form onSubmit={handleBookSession} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Time</label>
                  <input
                    type="time"
                    required
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Consultation Topic</label>
                <input
                  type="text"
                  required
                  value={bookingForm.topic}
                  onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
                  placeholder="E.g. Computer Science entry prep"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Description / Questions</label>
                <textarea
                  required
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                  placeholder="Tell the mentor what you want to discuss..."
                  rows={4}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="w-1/2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm"
                >
                  {loading ? 'Booking...' : 'Book Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
