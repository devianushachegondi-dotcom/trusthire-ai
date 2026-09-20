import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Sparkles,
  Star,
  Printer,
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Candidate, Resume, ScreeningResult, Certificate, CandidateMatch } from '../../types';
import {
  Card,
  Button,
  Badge,
  Tabs,
  LoadingState,
  ErrorState,
} from '../../components/common/UIComponents';

interface CandidateProfilePageProps {
  candidateId: string;
  onNavigate: (path: string) => void;
}

export const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({
  candidateId,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [jobMatches, setJobMatches] = useState<CandidateMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const loadCandidateData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCandidateProfile(candidateId);
      setCandidate(res.candidate);
      setResumes(res.resumes || []);
      setScreenings(res.screeningResults || []);
      setCertificates(res.certificates || []);
      setJobMatches(res.jobMatches || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load candidate profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidateData();
  }, [candidateId]);

  const handleToggleShortlist = async () => {
    if (!candidate) return;
    try {
      const res = await api.toggleShortlist(candidate.id);
      showToast(res.message, 'success');
      setCandidate({ ...candidate, isShortlisted: res.isShortlisted });
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle shortlist', 'error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !candidate) return;
    setIsAddingNote(true);
    try {
      const res = await api.addCandidateNote(candidate.id, newNoteContent.trim());
      showToast('Note recorded.', 'success');
      setCandidate({
        ...candidate,
        notes: [res.note, ...(candidate.notes || [])],
      });
      setNewNoteContent('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!candidate) return;
    try {
      await api.deleteCandidateNote(candidate.id, noteId);
      showToast('Note deleted.', 'info');
      setCandidate({
        ...candidate,
        notes: (candidate.notes || []).filter(n => n.id !== noteId),
      });
    } catch (err: any) {
      showToast(err.message || 'Could not delete note', 'error');
    }
  };

  if (isLoading) {
    return <LoadingState message="Retrieving candidate comprehensive profile..." height="h-96" />;
  }

  if (error || !candidate) {
    return (
      <ErrorState
        message={error || 'Candidate record not found.'}
        onRetry={loadCandidateData}
      />
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Skills' },
    { id: 'experience', label: `Experience (${candidate.experience?.length || 0})` },
    { id: 'education', label: `Education (${candidate.education?.length || 0})` },
    { id: 'projects', label: `Projects (${candidate.projects?.length || 0})` },
    { id: 'certificates', label: `Certificates (${certificates.length})` },
    { id: 'screening', label: 'AI Screening Evaluation' },
    { id: 'matches', label: 'Job Matches' },
    { id: 'notes', label: `Recruiter Notes (${candidate.notes?.length || 0})` },
  ];

  return (
    <div className="space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/candidates')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Candidates Directory
        </button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print / Export
          </Button>
          <Button
            size="sm"
            variant={candidate.isShortlisted ? 'primary' : 'outline'}
            onClick={handleToggleShortlist}
            leftIcon={
              <Star
                className={`w-3.5 h-3.5 ${
                  candidate.isShortlisted ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            }
          >
            {candidate.isShortlisted ? 'Shortlisted' : 'Shortlist Candidate'}
          </Button>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              {candidate.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900">{candidate.name}</h1>
                {candidate.isShortlisted && (
                  <Badge variant="warning">Shortlisted Candidate</Badge>
                )}
              </div>

              <p className="text-sm font-semibold text-blue-600 mt-0.5">
                {candidate.title || 'Applicant'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {candidate.phone}
                  </span>
                )}
                <span className="text-slate-300">•</span>
                <span>Profile created {new Date(candidate.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            {screenings.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                  AI Alignment Score
                </span>
                <span className="text-xl font-black text-blue-700">{screenings[0].score}%</span>
              </div>
            )}

            {certificates.length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Credentials
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  {certificates.filter(c => c.status === 'Verified').length} Verified
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs Row */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview & Skills */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Skills Inventory</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map(sk => (
                <span
                  key={sk}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {sk}
                </span>
              ))}
            </div>
          </Card>

          {/* Attached Resumes List */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Submitted Resume Documents</h3>
            <div className="space-y-2">
              {resumes.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-900">{r.fileName}</span>
                      <span className="text-slate-400 block text-[11px]">
                        Uploaded {new Date(r.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant={r.processingStatus === 'Processed' ? 'success' : 'info'}>
                    {r.processingStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Work Experience */}
      {activeTab === 'experience' && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Professional Employment History</h3>
          {candidate.experience.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No structured employment history logged.</p>
          ) : (
            <div className="space-y-6">
              {candidate.experience.map((exp, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-blue-500 space-y-1">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{exp.role}</h4>
                    <span className="text-xs font-medium text-slate-500">{exp.duration}</span>
                  </div>
                  <div className="text-xs font-semibold text-blue-600">{exp.company}</div>
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">{exp.responsibilities}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Education */}
      {activeTab === 'education' && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Academic Background</h3>
          {candidate.education.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No academic degrees logged.</p>
          ) : (
            <div className="space-y-4">
              {candidate.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{edu.degree}</h4>
                    <span className="text-xs text-slate-500 font-medium">Class of {edu.graduationYear}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-700">{edu.institution}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Projects */}
      {activeTab === 'projects' && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Key Projects & Portfolio Work</h3>
          {candidate.projects.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No portfolio projects logged.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidate.projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">{proj.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.technologies.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white border text-slate-700 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 5: Certificates */}
      {activeTab === 'certificates' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Verified Credentials & Certifications</h3>
            <Button size="sm" variant="outline" onClick={() => onNavigate('/certificates')}>
              Audit Certificates
            </Button>
          </div>

          {certificates.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No certificates on record for this candidate.</p>
          ) : (
            <div className="space-y-3">
              {certificates.map(cert => (
                <div key={cert.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900">{cert.certificateName}</div>
                    <div className="text-xs text-slate-600">
                      {cert.issuingOrganization} • ID: <span className="font-mono">{cert.certificateId}</span>
                    </div>
                    {cert.evidence && (
                      <div className="text-[11px] text-slate-500 pt-1">Evidence: {cert.evidence}</div>
                    )}
                  </div>
                  <Badge variant={cert.status === 'Verified' ? 'success' : cert.status === 'Needs Manual Review' ? 'warning' : 'neutral'}>
                    {cert.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 6: AI Screening */}
      {activeTab === 'screening' && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">AI Resume Screening Breakdown</h3>
          {screenings.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No screening results available. Upload or screen resume.</p>
          ) : (
            screenings.map(s => (
              <div key={s.id} className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-900">Score Alignment</span>
                    <p className="text-xs text-blue-700">Calculated via Gemini 3.8 Flash</p>
                  </div>
                  <div className="text-2xl font-black text-blue-800">{s.score}%</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-1">Matched Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {s.matchedSkills.map(sk => (
                        <span key={sk} className="px-2 py-0.5 bg-white rounded border border-emerald-200 text-emerald-800 text-[11px]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-900 block mb-1">Missing Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {s.missingSkills.map(sk => (
                        <span key={sk} className="px-2 py-0.5 bg-white rounded border border-amber-200 text-amber-800 text-[11px]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* Tab 7: Job Matches */}
      {activeTab === 'matches' && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Matching Requisitions</h3>
          {jobMatches.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No requisitions currently matched.</p>
          ) : (
            <div className="space-y-3">
              {jobMatches.map((m, idx) => (
                <div key={(m as any).id || (m as any).jobId || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{(m as any).jobTitle || 'Requisition'}</h4>
                    <p className="text-xs text-slate-500">Calculated alignment percentage</p>
                  </div>
                  <Badge variant={m.matchPercentage >= 75 ? 'success' : 'info'}>
                    {m.matchPercentage}% Match
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 8: Recruiter Notes */}
      {activeTab === 'notes' && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Recruiter Private Notes</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add internal commentary, interview reflections, or discussion points.
            </p>

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                placeholder="Type your confidential evaluation note here..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <div className="flex justify-end">
                <Button size="sm" type="submit" isLoading={isAddingNote} leftIcon={<Send className="w-3.5 h-3.5" />}>
                  Save Note
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {(!candidate.notes || candidate.notes.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recruiter notes logged yet.</p>
            ) : (
              candidate.notes.map(note => (
                <div key={note.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{note.authorName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
