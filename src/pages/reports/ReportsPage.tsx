import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Sparkles,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  Printer,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge, LoadingState } from '../../components/common/UIComponents';

interface ReportsPageProps {
  onNavigate: (path: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAISummary, setIsGeneratingAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');

  const [dateRange, setDateRange] = useState('30days');
  const [selectedJob, setSelectedJob] = useState('ALL');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.getAnalytics();
        setAnalytics(res);
      } catch (err: any) {
        showToast(err.message || 'Failed to load analytics', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [showToast]);

  const handleGenerateAISummary = async () => {
    setIsGeneratingAISummary(true);
    try {
      const res = await api.generateAISummary({
        dateRange,
        selectedJob,
      });
      setAiSummary(res.summary);
      showToast('AI Executive Summary generated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate AI summary', 'error');
    } finally {
      setIsGeneratingAISummary(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Resumes Screened,${analytics?.metrics?.totalScreened || 128}\n` +
      `Average Match Rate,${analytics?.metrics?.avgMatchRate || '78%'}\n` +
      `Shortlisted Candidates,${analytics?.metrics?.totalShortlisted || 34}\n` +
      `Certificates Verified,${analytics?.metrics?.verifiedCerts || 42}\n` +
      `Avg Screening Turnaround,${analytics?.metrics?.avgTurnaround || '2.4 mins'}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TrustHire_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded.', 'success');
  };

  if (isLoading) {
    return <LoadingState message="Compiling recruitment analytics & metrics..." height="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Recruitment Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit pipeline volume, credential authenticity ratios, and automated AI executive briefings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Report
          </Button>
          <Button
            size="sm"
            variant="primary"
            isLoading={isGeneratingAISummary}
            onClick={handleGenerateAISummary}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generate AI Briefing
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="bg-slate-50 font-semibold text-slate-700 py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="quarter">Current Quarter</option>
              <option value="year">All Time (YTD)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedJob}
              onChange={e => setSelectedJob(e.target.value)}
              className="bg-slate-50 font-semibold text-slate-700 py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="ALL">All Requisitions</option>
              <option value="eng">Engineering Positions</option>
              <option value="prod">Product Positions</option>
              <option value="sales">Sales & GTM Positions</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Last refreshed: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* AI Generated Executive Summary Box */}
      {aiSummary && (
        <Card className="p-6 bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-white border-blue-200 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Gemini Executive Recruitment Briefing
                </h3>
                <span className="text-[11px] text-slate-500">
                  Synthesized hiring insight based on live candidate pool metrics
                </span>
              </div>
            </div>
            <Badge variant="purple">Gemini Intelligence</Badge>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white/80 p-4 rounded-xl border border-blue-100 font-normal">
            {aiSummary}
          </div>
        </Card>
      )}

      {/* 4 Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Screening Velocity
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">1.8 min</div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3 h-3" /> 84% faster than manual
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Average Candidate Match
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">79.4%</div>
          <span className="text-[11px] text-blue-600 font-bold mt-0.5 block">
            +4.2% across technical roles
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Shortlist Conversion Rate
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">32.6%</div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            Top tier tier candidates saved
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Credential Authenticity
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">94.1%</div>
          <span className="text-[11px] text-teal-600 font-bold mt-0.5 block">
            Verified with issuing registries
          </span>
        </Card>
      </div>

      {/* Detailed Analytical Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline Progression */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hiring Pipeline Funnel</h3>
              <p className="text-xs text-slate-500">Applicant progression from ingestion to interview</p>
            </div>
            <Users className="w-4 h-4 text-blue-600" />
          </div>

          <div className="space-y-3 pt-2">
            {[
              { stage: 'Resumes Ingested', count: 184, pct: 100, color: 'bg-blue-600' },
              { stage: 'AI Screened & Parsed', count: 172, pct: 93, color: 'bg-indigo-600' },
              { stage: 'Strong Match (>75%)', count: 76, pct: 41, color: 'bg-teal-600' },
              { stage: 'Shortlisted by Recruiters', count: 38, pct: 21, color: 'bg-amber-500' },
              { stage: 'Credential Audited', count: 32, pct: 17, color: 'bg-emerald-600' },
            ].map(stage => (
              <div key={stage.stage}>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>{stage.stage}</span>
                  <span className="font-bold text-slate-900">
                    {stage.count} ({stage.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stage.color}`}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Most Demanded Technical Skills */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">High-Demand Skill Frequency</h3>
              <p className="text-xs text-slate-500">Most requested capabilities in active requisitions</p>
            </div>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-2.5 pt-2">
            {[
              { skill: 'TypeScript & JavaScript', freq: 94 },
              { skill: 'React / Next.js', freq: 88 },
              { skill: 'Cloud Architecture (AWS / GCP)', freq: 76 },
              { skill: 'Node.js & Backend APIs', freq: 72 },
              { skill: 'PostgreSQL / SQL', freq: 65 },
              { skill: 'Docker & Kubernetes', freq: 54 },
            ].map(item => (
              <div key={item.skill}>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>{item.skill}</span>
                  <span className="font-semibold text-slate-500">{item.freq}% of roles</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${item.freq}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
