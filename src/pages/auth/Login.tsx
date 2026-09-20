import React, { useState } from 'react';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/common/UIComponents';

interface LoginProps {
  onNavigate: (path: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const user = await login({ email, password });
      showToast(`Welcome back, ${user.name}!`, 'success');
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'Recruiter' | 'Admin') => {
    if (role === 'Recruiter') {
      setEmail('sarah.recruiter@techhire.io');
      setPassword('password123');
    } else {
      setEmail('admin@trusthire.ai');
      setPassword('password123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 mb-3">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          TrustHire<span className="text-blue-400">AI</span>
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-sm">
          Intelligent recruitment, AI resume screening, and certificate verification.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Sign In to Your Workspace</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access authorized candidate pools, jobs, and screening results.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@company.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full mt-2"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('Recruiter')}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 text-xs font-semibold transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Recruiter Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('Admin')}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-900 text-xs font-semibold transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              Admin Demo
            </button>
          </div>
        </div>

        {/* Sign Up Redirect */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('/signup')}
            className="font-bold text-blue-600 hover:text-blue-700"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};
