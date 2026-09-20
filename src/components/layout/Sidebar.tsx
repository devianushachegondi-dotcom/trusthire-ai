import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  UploadCloud,
  FileCheck2,
  GitCompare,
  Award,
  Users,
  BarChart3,
  Search,
  Sparkles,
  HelpCircle,
  Settings,
  ShieldCheck,
  Building2,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenAIAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
  onOpenAIAssistant,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Resume Upload', path: '/resumes/upload', icon: UploadCloud },
    { label: 'Resume Screening', path: '/screening', icon: FileCheck2 },
    { label: 'Candidate Matching', path: '/matching', icon: GitCompare },
    { label: 'Certificates', path: '/certificates', icon: Award },
    { label: 'Candidates', path: '/candidates', icon: Users },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Search & Filters', path: '/search', icon: Search },
    { label: 'AI Assistant', path: '#ai', icon: Sparkles, isAI: true },
    { label: 'Contact Support', path: '/support', icon: HelpCircle },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { label: 'Admin Overview', path: '/admin', icon: ShieldCheck },
    { label: 'Recruiters', path: '/admin/users', icon: Building2 },
    { label: 'All Candidates', path: '/admin/candidates', icon: Users },
    { label: 'All Jobs', path: '/admin/jobs', icon: Briefcase },
    { label: 'Verifications', path: '/admin/certificates', icon: Award },
    { label: 'Support Tickets', path: '/admin/support', icon: HelpCircle },
  ];

  const handleItemClick = (item: any) => {
    if (item.isAI) {
      onOpenAIAssistant();
    } else {
      onNavigate(item.path);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 shrink-0">
          <div
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                TrustHire<span className="text-blue-400">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Recruitment Platform</p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Main Recruitment
          </div>
          {navItems.map(item => {
            const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : item.isAI
                    ? 'text-purple-300 hover:bg-purple-950/40 hover:text-purple-200'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-white'
                        : item.isAI
                        ? 'text-purple-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.isAI && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    GenAI
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Panel Links */}
          {isAdmin && (
            <>
              <div className="pt-6 px-3 pb-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center justify-between">
                <span>Admin Console</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 text-[9px]">Protected</span>
              </div>
              {adminNavItems.map(item => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                        : 'text-slate-400 hover:text-purple-200 hover:bg-purple-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Recruiter Workspace Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
              {user?.company ? user.company.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.company || 'Organization'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
