import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { JobsPage } from './pages/jobs/JobsPage';
import { ResumeUploadPage } from './pages/resumes/ResumeUploadPage';
import { ScreeningPage } from './pages/screening/ScreeningPage';
import { CandidateMatchingPage } from './pages/matching/CandidateMatchingPage';
import { CandidatesPage } from './pages/candidates/CandidatesPage';
import { CandidateProfilePage } from './pages/candidates/CandidateProfilePage';
import { CertificatesPage } from './pages/certificates/CertificatesPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SupportPage } from './pages/support/SupportPage';
import { AdminPage } from './pages/admin/AdminPage';
import { LoadingState } from './components/common/UIComponents';

const MainRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();

  // Internal client-side route tracking
  const [currentRoute, setCurrentRoute] = useState<string>('/dashboard');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  // Sync with browser URL / hash
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash.replace('#', '') || '/dashboard';
      const [path, search] = hash.split('?');
      setCurrentRoute(path || '/dashboard');

      const params: Record<string, string> = {};
      if (search) {
        new URLSearchParams(search).forEach((val, key) => {
          params[key] = val;
        });
      }
      setQueryParams(params);
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, []);

  const navigate = (fullPath: string) => {
    window.location.hash = fullPath;
    const [path, search] = fullPath.split('?');
    setCurrentRoute(path);

    const params: Record<string, string> = {};
    if (search) {
      new URLSearchParams(search).forEach((val, key) => {
        params[key] = val;
      });
    }
    setQueryParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingState message="Initializing TrustHire AI Environment..." />
      </div>
    );
  }

  // If not authenticated, render auth views
  if (!isAuthenticated) {
    if (currentRoute === '/signup') {
      return <Signup onNavigate={navigate} />;
    }
    if (currentRoute === '/forgot-password') {
      return <ForgotPassword onNavigate={navigate} />;
    }
    return <Login onNavigate={navigate} />;
  }

  // Render main app layout
  const renderPageContent = () => {
    // Check candidate profile dynamic route: /candidates/:id
    if (currentRoute.startsWith('/candidates/') && currentRoute !== '/candidates') {
      const candidateId = currentRoute.replace('/candidates/', '');
      return <CandidateProfilePage candidateId={candidateId} onNavigate={navigate} />;
    }

    switch (currentRoute) {
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} />;

      case '/jobs':
        return <JobsPage onNavigate={navigate} />;

      case '/resumes/upload':
        return <ResumeUploadPage onNavigate={navigate} initialJobId={queryParams.jobId} />;

      case '/screening':
        return <ScreeningPage onNavigate={navigate} />;

      case '/matching':
        return <CandidateMatchingPage onNavigate={navigate} initialJobId={queryParams.jobId} />;

      case '/candidates':
        return <CandidatesPage onNavigate={navigate} />;

      case '/certificates':
        return <CertificatesPage onNavigate={navigate} />;

      case '/reports':
        return <ReportsPage onNavigate={navigate} />;

      case '/support':
        return <SupportPage />;

      case '/admin':
        if (user?.role !== 'Admin') {
          return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Restricted Access</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                You must be logged in as an Administrator to access the System Console.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Return to Dashboard
              </button>
            </div>
          );
        }
        return <AdminPage />;

      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <AppShell currentPath={currentRoute} onNavigate={navigate}>
      {renderPageContent()}
    </AppShell>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ToastProvider>
  );
}
