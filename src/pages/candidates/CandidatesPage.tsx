import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Star,
  Eye,
  Mail,
  Phone,
  Briefcase,
  Award,
  Filter,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Candidate } from '../../types';
import { Card, Button, Badge, LoadingState, EmptyState } from '../../components/common/UIComponents';

interface CandidatesPageProps {
  onNavigate: (path: string) => void;
}

export const CandidatesPage: React.FC<CandidatesPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shortlistOnly, setShortlistOnly] = useState(false);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await api.getCandidates();
        setCandidates(res.candidates || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load candidates', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadCandidates();
  }, [showToast]);

  const handleToggleShortlist = async (candidateId: string) => {
    try {
      const res = await api.toggleShortlist(candidateId);
      showToast(res.message, 'success');
      setCandidates(prev =>
        prev.map(c => (c.id === candidateId ? { ...c, isShortlisted: res.isShortlisted } : c))
      );
    } catch (err: any) {
      showToast(err.message || 'Shortlist toggle failed', 'error');
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      c.skills.some(s => s.toLowerCase().includes(q));

    const matchesShortlist = !shortlistOnly || !!c.isShortlisted;
    return matchesSearch && matchesShortlist;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Candidate Pool</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of candidate profiles, skill matrices, and AI evaluations.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onNavigate('/resumes/upload')}
          leftIcon={<Users className="w-4 h-4" />}
        >
          Upload More Resumes
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, email, role, or skill..."
            className="w-full bg-slate-50 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={shortlistOnly}
              onChange={e => setShortlistOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Shortlisted Only</span>
          </label>
        </div>
      </div>

      {/* Candidates Grid */}
      {isLoading ? (
        <LoadingState message="Loading candidates..." />
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          title="No candidates found"
          description="Upload resumes to ingest and evaluate applicants into your candidate directory."
          actionText="Upload Resumes"
          onAction={() => onNavigate('/resumes/upload')}
          icon={<Users className="w-6 h-6 text-blue-600" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCandidates.map(cand => (
            <Card key={cand.id} hoverable className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">
                      {cand.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {cand.name}
                      </h3>
                      <p className="text-xs text-slate-500">{cand.title || 'Applicant'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleShortlist(cand.id)}
                    title={cand.isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        cand.isShortlisted ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-500 mb-3.5">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.email}</span>
                  </div>
                  {cand.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cand.phone}</span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate">{cand.jobTitle || 'General Pool'}</span>
                  {cand.screeningScore !== null && cand.screeningScore !== undefined && (
                    <Badge variant={cand.screeningScore >= 80 ? 'success' : 'info'}>
                      {cand.screeningScore}% Match
                    </Badge>
                  )}
                </div>

                {/* Skills Preview */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {cand.skills.slice(0, 4).map(skill => (
                      <span
                        key={skill}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {cand.skills.length > 4 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        +{cand.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Badge
                  variant={
                    cand.certificateStatus === 'Verified'
                      ? 'success'
                      : cand.certificateStatus === 'Needs Manual Review'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  Cert: {cand.certificateStatus || 'None'}
                </Badge>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate(`/candidates/${cand.id}`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
