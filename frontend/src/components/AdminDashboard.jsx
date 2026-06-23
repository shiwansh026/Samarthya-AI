import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, ShieldCheck, ShieldAlert, Check, Ban } from 'lucide-react';
import { adminGetUsers, adminVerifyMentor, adminToggleActive } from '../api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const uList = await adminGetUsers();
      setUsers(uList);
    } catch (err) {
      setError('Failed to fetch user list for administration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerifyMentor = async (mentorUserId) => {
    setError('');
    setSuccess('');
    setActionLoading({ ...actionLoading, [mentorUserId]: 'verify' });
    try {
      const data = await adminVerifyMentor(mentorUserId);
      setSuccess(data.message);
      // Refresh user records
      const uList = await adminGetUsers();
      setUsers(uList);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify mentor.');
    } finally {
      setActionLoading({ ...actionLoading, [mentorUserId]: null });
    }
  };

  const handleToggleActive = async (userId) => {
    setError('');
    setSuccess('');
    setActionLoading({ ...actionLoading, [userId]: 'active' });
    try {
      const data = await adminToggleActive(userId);
      setSuccess(data.message);
      // Refresh user records
      const uList = await adminGetUsers();
      setUsers(uList);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle user active status.');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null });
    }
  };

  if (loading && users.length === 0) {
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

      <h2 className="text-2xl font-black mb-6 text-zinc-900 flex items-center space-x-2">
        <Shield className="w-6 h-6 text-zinc-900" />
        <span>Platform Users Administration</span>
      </h2>

      <div className="glass-card overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-555">
            <thead className="bg-zinc-50 text-zinc-700 border-b border-zinc-200 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">System Role</th>
                <th className="px-6 py-4 text-center">Email Verification</th>
                <th className="px-6 py-4 text-center">Mentor Verification</th>
                <th className="px-6 py-4 text-center">Account Status</th>
                <th className="px-6 py-4 text-center">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {users.map(u => {
                const isMentor = u.role === 'mentor';
                const isVerifiedMentor = isMentor && u.profile?.is_verified;
                const isLoading = actionLoading[u.id];

                return (
                  <tr key={u.id} className="hover:bg-zinc-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        u.role === 'student'
                          ? 'bg-zinc-100 text-zinc-755 border border-zinc-200'
                          : 'bg-zinc-200 text-zinc-800 border border-zinc-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {u.is_verified ? (
                          <>
                            <Check className="w-4 h-4 text-zinc-900" />
                            <span className="text-xs text-zinc-900 font-semibold">Verified</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs text-zinc-500 font-semibold">Pending</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isMentor ? (
                        <div className="flex items-center justify-center space-x-1.5">
                          {isVerifiedMentor ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-zinc-900" />
                              <span className="text-xs text-zinc-900 font-semibold">Verified</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-4 h-4 text-zinc-400" />
                              <span className="text-xs text-zinc-550 font-semibold">Pending Verification</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">N/A (Student)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {u.is_active ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
                            <span className="text-xs text-zinc-900 font-semibold">Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-zinc-300"></span>
                            <span className="text-xs text-zinc-450 font-semibold">Blocked</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {isMentor && !isVerifiedMentor && (
                          <button
                            onClick={() => handleVerifyMentor(u.id)}
                            disabled={!!isLoading}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                          >
                            {isLoading === 'verify' ? '...' : 'Verify'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          disabled={!!isLoading}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                            u.is_active
                              ? 'bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm'
                          }`}
                        >
                          {isLoading === 'active' ? '...' : u.is_active ? 'Block' : 'Unblock'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
