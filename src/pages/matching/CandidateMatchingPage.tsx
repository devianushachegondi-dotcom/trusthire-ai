import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Briefcase,
  Search,
  Star,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowUpDown,
  Filter,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Job, CandidateMatch } from '../../types';
import { Card, Button, Badge, LoadingState, EmptyState } from '../../components/common/UIComponents';

interface CandidateMatchingPageProps {
  onNavigate: (path: string) => void;
  initialJobId?: string;
}

export const CandidateMatchingPage: React.FC<CandidateMatchingPageProps> = ({
  onNavigate,
  initialJobId,
}) => {
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterShortlistedOnly, setFilterShortlistedOnly] = useState(false);
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);
  const [certFilter, setCertFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match-desc' | 'match-asc'>('match-desc');

  useEffect(() => {
    async function loadJobsList() {
      try {
        const res = await api.getJobs();
        const availableJobs = res.jobs || [];
        setJobs(availableJobs);

        const targetId = selectedJobId || (availableJobs.length > 0 ? availableJobs[0].id : '');
        if (targetId) {
          setSelectedJobId(targetId);
        } else {
          setIsLoading(false);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load jobs', 'error');
        setIsLoading(false);
      }
    }
    loadJobsList();
  }, [showToast]);

  useEffect(() => {
    if (!selectedJobId) return;

    async function loadMatches() {
      setIsLoading(true);
      try {
        const res = await api.getJobMatches(selectedJobId);
        setSelectedJob(res.job);
        setCandidates(res.candidates || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load candidate matches', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, [selectedJobId, showToast]);

  const handleToggleShortlist = async (candidateId: string) => {
    try {
      const res = await api.toggleShortlist(candidateId);
      showToast(res.message, 'success');
      setCandidates(prev =>
        prev.map(c => (c.candidateId === candidateId ? { ...c, isShortlisted: res.isShortlisted } : c))
      );
    } catch (err: any) {
      showToast(err.message || 'Shortlist toggle failed', 'error');
    }
  };

  const filteredCandidates = candidates
    .filter(c => {
      if (filterShortlistedOnly && !c.isShortlisted) return false;
      if (c.matchPercentage < minMatchFilter) return false;
      if (certFilter !== 'ALL' && c.certificateStatus !== certFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'match-desc') return b.matchPercentage - a.matchPercentage;
      return a.matchPercentage - b.matchPercentage;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Candidate Matching & Ranking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent algorithmic alignment comparing candidate profiles and job requisitions.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onNavigate('/reports')}
          leftIcon={<Award className="w-4 h-4" />}
        >
          Generate Match Report
        </Button>
      </div>

      {/* Target Job Selector & Criteria Summary */}
      <Card className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Job Position
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="w-full bg-slate-50 text-xs font-semibold text-slate-900 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department} • {j.candidateCount || 0} applicants)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedJob && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-900">Required Skills: </span>
                <span className="text-slate-600 font-medium">
                  {selectedJob.requiredSkills.join(', ') || 'Not specified'}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <div>
                <span className="font-bold text-slate-900">Experience: </span>
                <span>{selectedJob.experienceRequired}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={filterShortlistedOnly}
                onChange={e => setFilterShortlistedOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Shortlisted Candidates Only</span>
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Min Match:</span>
              <select
                value={minMatchFilter}
                onChange={e => setMinMatchFilter(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value={0}>All Scores (0%+)</option>
                <option value={60}>60% and higher</option>
                <option value={75}>75% and higher</option>
                <option value={90}>90% and higher</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Credentials:</span>
              <select
                value={certFilter}
                onChange={e => setCertFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Verified">Verified Only</option>
                <option value="Needs Manual Review">Needs Review</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="match-desc">Highest Match First</option>
              <option value="match-asc">Lowest Match First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Candidates Match Ranking List */}
      {isLoading ? (
        <LoadingState message="Matching candidates against requisition parameters..." />
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          title="No matching candidates"
          description="Try relaxing your score or shortlist filters, or upload more resumes for this job."
          actionText="Upload Resumes"
          onAction={() => onNavigate(`/resumes/upload?jobId=${selectedJobId}`)}
          icon={<GitCompare className="w-6 h-6 text-blue-600" />}
        />
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((cand, idx) => (
            <Card key={cand.candidateId} hoverable className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Rank, Candidate Name, Title, Contacts */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                    #{idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {cand.candidateName}
                      </h3>
                      <button
                        onClick={() => handleToggleShortlist(cand.candidateId)}
                        title={cand.isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                        className="p-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            cand.isShortlisted ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 truncate">{cand.candidateEmail}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                      <span>Exp: {cand.experienceYears}</span>
                      <span className="text-slate-300">•</span>
                      <span>{cand.education}</span>
                      <span className="text-slate-300">•</span>
                      <Badge
                        variant={
                          cand.certificateStatus === 'Verified'
                            ? 'success'
                            : cand.certificateStatus === 'Needs Manual Review'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        Cert: {cand.certificateStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Center: Match Percentage Score Pill */}
                <div className="flex flex-col items-start md:items-end justify-center shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Match Score:</span>
                    <div
                      className={`text-xl font-black px-3 py-1 rounded-xl border ${
                        cand.matchPercentage >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : cand.matchPercentage >= 65
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {cand.matchPercentage}%
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Status: {cand.screeningStatus}
                  </span>
                </div>

                {/* Right: Profile Actions */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate(`/candidates/${cand.candidateId}`)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onNavigate('/screening')}
                    leftIcon={<FileCheck2 className="w-3.5 h-3.5" />}
                  >
                    Screening
                  </Button>
                </div>
              </div>

              {/* Skills matched vs missing bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Matched ({cand.matchedSkills.length}):
                  </span>
                  {cand.matchedSkills.slice(0, 4).map(s => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200 text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                  {cand.matchedSkills.length > 4 && (
                    <span className="text-slate-400 text-[10px]">+{cand.matchedSkills.length - 4}</span>
                  )}
                </div>

                {cand.missingSkills?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Missing:
                    </span>
                    {cand.missingSkills.slice(0, 3).map(s => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200 text-[11px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
