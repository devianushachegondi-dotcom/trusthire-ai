import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Star,
  RefreshCw,
  Save,
  GraduationCap,
  Briefcase,
  Award,
  HelpCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ScreeningResult } from '../../types';
import {
  Card,
  Button,
  Badge,
  Modal,
  ProgressBar,
  LoadingState,
  EmptyState,
} from '../../components/common/UIComponents';

interface ScreeningPageProps {
  onNavigate: (path: string) => void;
}

export const ScreeningPage: React.FC<ScreeningPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('ALL');

  // Inspection modal state
  const [activeScreening, setActiveScreening] = useState<ScreeningResult | null>(null);
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadScreenings = async () => {
    try {
      const res = await api.getScreenings();
      setScreenings(res.screenings || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load screening results', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScreenings();
  }, []);

  const openInspectionModal = (s: ScreeningResult) => {
    setActiveScreening(s);
    setRecruiterNotes(s.recruiterNotes || '');
  };

  const handleSaveNotes = async () => {
    if (!activeScreening) return;
    setIsSavingNotes(true);
    try {
      await api.saveScreeningNotes(activeScreening.id, recruiterNotes);
      showToast('Recruiter notes saved.', 'success');
      setActiveScreening(prev => (prev ? { ...prev, recruiterNotes } : null));
      setScreenings(prev =>
        prev.map(item => (item.id === activeScreening.id ? { ...item, recruiterNotes } : item))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save notes', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleRetryScreening = async () => {
    if (!activeScreening) return;
    setIsRetrying(true);
    try {
      const res = await api.retryScreening(activeScreening.id);
      showToast('AI Screening re-evaluation complete!', 'success');
      setActiveScreening(res.screening);
      loadScreenings();
    } catch (err: any) {
      showToast(err.message || 'Re-screening failed', 'error');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleToggleShortlist = async (candidateId: string) => {
    try {
      const res = await api.toggleShortlist(candidateId);
      showToast(res.message, 'success');
      setScreenings(prev =>
        prev.map(s => (s.candidateId === candidateId ? { ...s, isShortlisted: res.isShortlisted } : s))
      );
      if (activeScreening?.candidateId === candidateId) {
        setActiveScreening(prev => (prev ? { ...prev, isShortlisted: res.isShortlisted } : null));
      }
    } catch (err: any) {
      showToast(err.message || 'Shortlist toggle failed', 'error');
    }
  };

  const filteredScreenings = screenings.filter(s => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (s.candidateName && s.candidateName.toLowerCase().includes(query)) ||
      (s.jobTitle && s.jobTitle.toLowerCase().includes(query)) ||
      s.matchedSkills.some(sk => sk.toLowerCase().includes(query));

    let matchesScore = true;
    if (scoreFilter === '90+') matchesScore = s.score >= 90;
    else if (scoreFilter === '75-89') matchesScore = s.score >= 75 && s.score < 90;
    else if (scoreFilter === '60-74') matchesScore = s.score >= 60 && s.score < 75;
    else if (scoreFilter === '<60') matchesScore = s.score < 60;

    return matchesSearch && matchesScore;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Resume Screening Evaluation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent algorithmic analysis by Gemini 3.8 Flash comparing qualifications against job specs.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onNavigate('/resumes/upload')}
          leftIcon={<FileCheck2 className="w-4 h-4" />}
        >
          Upload New Resumes
        </Button>
      </div>

      {/* Search & Score Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, role, or matched skill..."
            className="w-full bg-slate-50 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={scoreFilter}
            onChange={e => setScoreFilter(e.target.value)}
            className="bg-slate-50 text-xs font-semibold text-slate-700 py-2 px-3 rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="ALL">All Match Scores</option>
            <option value="90+">Top Tier (90%+)</option>
            <option value="75-89">High Match (75-89%)</option>
            <option value="60-74">Moderate Match (60-74%)</option>
            <option value="<60">Low Match (&lt;60%)</option>
          </select>
        </div>
      </div>

      {/* Screenings Table */}
      {isLoading ? (
        <LoadingState message="Analyzing screening repository..." />
      ) : filteredScreenings.length === 0 ? (
        <EmptyState
          title="No screening results found"
          description="Upload resumes to run automatic AI screening against your defined job requisitions."
          actionText="Upload Resumes"
          onAction={() => onNavigate('/resumes/upload')}
          icon={<Sparkles className="w-6 h-6 text-purple-600" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScreenings.map(s => (
            <Card key={s.id} hoverable className="p-5 flex flex-col justify-between">
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {s.candidateName || 'Applicant'}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{s.candidateEmail}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleShortlist(s.candidateId)}
                      title={s.isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                      className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s.isShortlisted ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                    <div
                      className={`text-sm font-black px-2 py-0.5 rounded-lg border ${
                        s.score >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.score >= 65
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {s.score}%
                    </div>
                  </div>
                </div>

                {/* Job Requisition banner */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
                  <span className="truncate">{s.jobTitle}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Match Evaluation Highlights */}
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Education</span>
                    <span className="font-semibold text-slate-700">
                      {s.educationMatch?.match || 'Analyzed'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Experience</span>
                    <span className="font-semibold text-slate-700">
                      {s.experienceMatch?.match || 'Analyzed'}
                    </span>
                  </div>
                </div>

                {/* Matched skills pill list */}
                <div className="mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Matched Skills ({s.matchedSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.matchedSkills.slice(0, 3).map(skill => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200"
                      >
                        {skill}
                      </span>
                    ))}
                    {s.matchedSkills.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        +{s.matchedSkills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Missing skills pill list */}
                {s.missingSkills?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Missing Skills ({s.missingSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.missingSkills.slice(0, 2).map(skill => (
                        <span
                          key={skill}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigate(`/candidates/${s.candidateId}`)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Full Profile
                </button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => openInspectionModal(s)}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Inspect Score
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed Inspection Modal */}
      <Modal
        isOpen={!!activeScreening}
        onClose={() => setActiveScreening(null)}
        title={`AI Screening Evaluation: ${activeScreening?.candidateName || 'Candidate'}`}
        description={`Evaluated against: ${activeScreening?.jobTitle}`}
        maxWidth="3xl"
      >
        {activeScreening && (
          <div className="space-y-6">
            {/* Top Score Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
                  Overall Alignment Score
                </span>
                <div className="text-3xl font-black">{activeScreening.score}%</div>
                <p className="text-xs text-blue-100/80">
                  Calculated by Gemini 3.8 Flash factoring skills, experience, and education.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleToggleShortlist(activeScreening.candidateId)}
                  leftIcon={
                    <Star
                      className={`w-4 h-4 ${
                        activeScreening.isShortlisted ? 'text-amber-500 fill-amber-500' : ''
                      }`}
                    />
                  }
                >
                  {activeScreening.isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isRetrying}
                  onClick={handleRetryScreening}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Re-evaluate
                </Button>
              </div>
            </div>

            {/* Criteria Evaluation Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Education Match</span>
                </div>
                <Badge variant={activeScreening.educationMatch?.match === 'High' ? 'success' : 'neutral'}>
                  {activeScreening.educationMatch?.match || 'Evaluated'}
                </Badge>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  {activeScreening.educationMatch?.details || 'Requirement verified against degree history.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Experience Match</span>
                </div>
                <Badge variant={activeScreening.experienceMatch?.match === 'High' ? 'success' : 'neutral'}>
                  {activeScreening.experienceMatch?.match || 'Evaluated'}
                </Badge>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  {activeScreening.experienceMatch?.details || 'Job history meets experience benchmarks.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800">Certifications Match</span>
                </div>
                <Badge variant={activeScreening.certificationMatch?.match === 'High' ? 'success' : 'neutral'}>
                  {activeScreening.certificationMatch?.match || 'Evaluated'}
                </Badge>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  {activeScreening.certificationMatch?.details || 'Industry credentials reviewed.'}
                </p>
              </div>
            </div>

            {/* Matched vs Missing Skills breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <h4 className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Matched Required Skills ({activeScreening.matchedSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeScreening.matchedSkills.map(sk => (
                    <span
                      key={sk}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-medium shadow-2xs"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Missing Skills Gap ({activeScreening.missingSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeScreening.missingSkills.length === 0 ? (
                    <p className="text-xs text-amber-800 font-medium">None! Candidate covers all required skills.</p>
                  ) : (
                    activeScreening.missingSkills.map(sk => (
                      <span
                        key={sk}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-800 font-medium shadow-2xs"
                      >
                        {sk}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Strengths & Missing Information */}
            <div className="space-y-3">
              {activeScreening.strengths?.length > 0 && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Identified Candidate Strengths</h4>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                    {activeScreening.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeScreening.missingInformation?.length > 0 && (
                <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-900 mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                    Missing or Unclear Information
                  </h4>
                  <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                    {activeScreening.missingInformation.map((info, idx) => (
                      <li key={idx}>{info}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recruiter Internal Notes */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Recruiter Evaluation Notes
              </label>
              <textarea
                value={recruiterNotes}
                onChange={e => setRecruiterNotes(e.target.value)}
                rows={3}
                placeholder="Add private recruiter notes, interview talking points, or follow-up questions..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 mb-2"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  isLoading={isSavingNotes}
                  onClick={handleSaveNotes}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
