import React, { useState } from 'react';
import { Sparkles, Mail, Lock, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/common/UIComponents';

interface ForgotPasswordProps {
  onNavigate: (path: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
      setStep('reset');
      showToast('Reset verification token created.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Could not process request', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      await api.resetPassword({ email, newPassword });
      showToast('Password updated! You can now log in.', 'success');
      onNavigate('/login');
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        <button
          onClick={() => onNavigate('/login')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-1">
          {step === 'request' ? 'Reset Account Password' : 'Set New Password'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {step === 'request'
            ? 'Enter your account email to receive your password reset token.'
            : 'Enter your new secure password below to regain workspace access.'}
        </p>

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Send Reset Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {message && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>{message}</p>
              </div>
            )}
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
