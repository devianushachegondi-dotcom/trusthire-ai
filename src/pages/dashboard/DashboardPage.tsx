import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  FileCheck2,
  UserCheck,
  Award,
  Clock,
  ArrowUpRight,
  Plus,
  UploadCloud,
  Sparkles,
  BarChart3,
  ChevronRight,
  Star,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge, LoadingState } from '../../components/common/UIComponents';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, actRes, candRes] = await Promise.all([
          api.getDashboardStats(),
          api.getActivities(),
          api.getRecentCandidates(),
        ]);
        setStats(statsRes);
        setActivities(actRes.activities || []);
        setRecentCandidates(candRes.candidates || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load dashboard data', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [showToast]);

  if (isLoading) {
    return <LoadingState message="Loading your recruitment dashboard..." height="h-96" />;
  }

  const kpis = [
    {
      title: 'Total Jobs',
      value: stats?.totalJobs ?? 0,
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50 text-blue-700',
      path: '/jobs',
    },
    {
      title: 'Total Candidates',
      value: stats?.totalCandidates ?? 0,
      icon: Users,
      color: 'from-indigo-600 to-purple-600',
      bgColor: 'bg-indigo-50 text-indigo-700',
      path: '/candidates',
    },
    {
      title: 'Resumes Screened',
      value: stats?.resumesScreened ?? 0,
      icon: FileCheck2,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-50 text-emerald-700',
      path: '/screening',
    },
    {
      title: 'Shortlisted',
      value: stats?.shortlistedCandidates ?? 0,
      icon: UserCheck,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 text-amber-700',
      path: '/matching',
    },
    {
      title: 'Certs Verified',
      value: stats?.certificatesVerified ?? 0,
      icon: Award,
      color: 'from-teal-600 to-emerald-600',
      bgColor: 'bg-teal-50 text-teal-700',
      path: '/certificates',
    },
    {
      title: 'Pending Verifications',
      value: stats?.pendingVerifications ?? 0,
      icon: Clock,
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-50 text-purple-700',
      path: '/certificates',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Recruitment Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time candidate pipelines, Gemini AI resume scores, and credential verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<UploadCloud className="w-4 h-4" />}
            onClick={() => onNavigate('/resumes/upload')}
          >
            Upload Resumes
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => onNavigate('/jobs')}
          >
            Create Job
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.title}
              hoverable
              onClick={() => onNavigate(kpi.path)}
              className="p-4 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`p-2 rounded-xl ${kpi.bgColor}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                  {kpi.title}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Visual Charts Grid (4 Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Candidate Status Distribution */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Candidate Pipeline Distribution</h3>
              <p className="text-xs text-slate-500">Pipeline progression across your active roles</p>
            </div>
            <Badge variant="info">Realtime</Badge>
          </div>

          <div className="space-y-3.5 pt-2">
            {stats?.charts?.candidateStatusDistribution?.map((item: any) => {
              const total =
                stats?.charts?.candidateStatusDistribution?.reduce((a: number, b: any) => a + b.value, 0) || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{item.name}</span>
                    <span className="text-slate-500">
                      {item.value} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Chart 2: Candidates per Job */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Applicants per Active Role</h3>
              <p className="text-xs text-slate-500">Resume volume across priority requisitions</p>
            </div>
            <button
              onClick={() => onNavigate('/jobs')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              View Jobs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {stats?.charts?.candidatesPerJob?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active job requisitions yet.</p>
            ) : (
              stats?.charts?.candidatesPerJob?.map((item: any) => {
                const max = Math.max(...stats.charts.candidatesPerJob.map((j: any) => j.count), 1);
                const pct = Math.round((item.count / max) * 100);
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1 truncate">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="text-slate-500 shrink-0 font-bold">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Chart 3: Resume Screening Scores */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Screening Score Brackets</h3>
              <p className="text-xs text-slate-500">Evaluation benchmarks calculated by Gemini 3.8 Flash</p>
            </div>
            <Badge variant="purple">Gemini Scored</Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {stats?.charts?.screeningBrackets?.map((b: any) => (
              <div key={b.range} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="text-xl font-extrabold text-slate-900">{b.count}</div>
                <div className="text-[11px] font-semibold text-slate-600 mt-0.5">{b.range}</div>
                <div className="text-[10px] text-slate-400">Match</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chart 4: Certificate Verification Breakdown */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Credential Verification Status</h3>
              <p className="text-xs text-slate-500">Audit authenticity of certificates and degrees</p>
            </div>
            <button
              onClick={() => onNavigate('/certificates')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              Verify <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {stats?.charts?.certificateStatusData?.map((item: any) => (
              <div
                key={item.status}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-700">{item.status}</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{item.count}</div>
                </div>
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Recent Candidates Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Candidates (2 Cols) */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Candidates & Evaluation</h3>
              <p className="text-xs text-slate-500">Newly analyzed applicants ready for recruiter decision</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('/candidates')}>
              View All Candidates
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Match</th>
                  <th className="py-2.5 px-3">Credentials</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No candidates currently in workspace.
                    </td>
                  </tr>
                ) : (
                  recentCandidates.map(cand => (
                    <tr key={cand.candidateId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {cand.name}
                          {cand.isShortlisted && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{cand.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium">{cand.jobTitle}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              cand.matchPercentage >= 80
                                ? 'text-emerald-600'
                                : cand.matchPercentage >= 60
                                ? 'text-blue-600'
                                : 'text-slate-600'
                            }`}
                          >
                            {cand.matchPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            cand.certificateStatus === 'Verified'
                              ? 'success'
                              : cand.certificateStatus === 'Needs Manual Review'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {cand.certificateStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onNavigate(`/candidates/${cand.candidateId}`)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Activity Feed (1 Col) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Activities</h3>
              <p className="text-xs text-slate-500">Live recruitment audit logs</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recorded activities yet.</p>
            ) : (
              activities.map(act => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium leading-tight">
                      <span className="font-bold text-slate-900">{act.userName}</span> {act.action.toLowerCase()}:{' '}
                      <span className="text-blue-600 font-medium truncate">{act.targetName}</span>
                    </p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
