import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, Phone, Building, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Select } from '../../components/common/UIComponents';

interface SignupProps {
  onNavigate: (path: string) => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
    role: 'Recruiter',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please provide your name, email, and password.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const user = await signup(formData);
      showToast(`Welcome to TrustHire AI, ${user.name}!`, 'success');
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Create Your TrustHire AI Account
        </h1>
        <p className="text-xs text-slate-300 mt-0.5">
          Join leading recruitment teams streamlining candidate evaluation.
        </p>
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Sarah Jenkins"
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Company Name"
              value={formData.company}
              onChange={e => handleChange('company', e.target.value)}
              placeholder="Acme Recruiting"
              leftIcon={<Building className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Work Email"
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="s.jenkins@acme.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={e => handleChange('password', e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={e => handleChange('confirmPassword', e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <Select
            label="Account Role"
            value={formData.role}
            onChange={e => handleChange('role', e.target.value)}
            options={[
              { value: 'Recruiter', label: 'Recruiter (Candidate screening & job matching)' },
              { value: 'Admin', label: 'Admin (Full organization & system management)' },
            ]}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full mt-2"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="font-bold text-blue-600 hover:text-blue-700"
          >
            Sign In Instead
          </button>
        </div>
      </div>
    </div>
  );
};
