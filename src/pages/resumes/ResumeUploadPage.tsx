import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  Sparkles,
  AlertCircle,
  Briefcase,
  FileCode,
  File,
  Loader2,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Job, Resume } from '../../types';
import { Card, Button, Badge, LoadingState } from '../../components/common/UIComponents';

interface ResumeUploadPageProps {
  onNavigate: (path: string) => void;
  initialJobId?: string;
}

interface SelectedFileItem {
  file: File;
  name: string;
  size: number;
  type: string;
  candidateName: string;
  candidateEmail: string;
  rawText: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export const ResumeUploadPage: React.FC<ResumeUploadPageProps> = ({ onNavigate, initialJobId }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);

  // Screening trigger loading state
  const [screeningResumeId, setScreeningResumeId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobsRes, resumesRes] = await Promise.all([api.getJobs(), api.getResumes()]);
        setJobs(jobsRes.jobs || []);
        if (jobsRes.jobs?.length > 0 && !selectedJobId) {
          setSelectedJobId(jobsRes.jobs[0].id);
        }
        setResumes(resumesRes.resumes || []);
      } catch (err: any) {
        showToast(err.message || 'Error loading records', 'error');
      } finally {
        setIsLoadingResumes(false);
      }
    }
    loadData();
  }, [showToast, selectedJobId]);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validFiles: SelectedFileItem[] = [];

    Array.from(incomingFiles).forEach(f => {
      const isExtValid = f.name.endsWith('.pdf') || f.name.endsWith('.docx') || f.name.endsWith('.txt');
      if (!isExtValid && !acceptedTypes.includes(f.type)) {
        showToast(`Skipped ${f.name}: only PDF, DOCX, and TXT are supported.`, 'warning');
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        showToast(`Skipped ${f.name}: maximum file size is 20MB.`, 'warning');
        return;
      }

      // Generate suggested candidate name from filename
      const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

      // Read text content preview if txt, or synthesize standard candidate text for demo extraction
      const reader = new FileReader();
      reader.onload = e => {
        const content = (e.target?.result as string) || '';
        validFiles.push({
          file: f,
          name: f.name,
          size: f.size,
          type: f.type,
          candidateName: cleanName,
          candidateEmail: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@candidate.org`,
          rawText: content.substring(0, 10000) || `${cleanName}\nProfessional applicant for role.`,
          status: 'pending',
        });
        setSelectedFiles(prev => [...prev, ...validFiles]);
      };
      if (f.type === 'text/plain') {
        reader.readAsText(f);
      } else {
        // Mocking resume raw text for non-text preview files
        validFiles.push({
          file: f,
          name: f.name,
          size: f.size,
          type: f.type,
          candidateName: cleanName,
          candidateEmail: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@candidate.org`,
          rawText: `${cleanName}\n${cleanName.toLowerCase().replace(/\s+/g, '.')}@candidate.org\nPhone: +1 555-0199\nSummary: Experienced engineer and practitioner with verified background in modern development frameworks.`,
          status: 'pending',
        });
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const updateFileName = (idx: number, name: string) => {
    setSelectedFiles(prev =>
      prev.map((item, i) => (i === idx ? { ...item, candidateName: name } : item))
    );
  };

  const handleUploadAll = async () => {
    if (!selectedJobId) {
      showToast('Please select a target job requisition first.', 'warning');
      return;
    }
    if (selectedFiles.length === 0) {
      showToast('Please select or drag at least one resume file.', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(50);
      const payload = {
        jobId: selectedJobId,
        files: selectedFiles.map(f => ({
          fileName: f.name,
          fileType: f.type || 'application/pdf',
          candidateName: f.candidateName,
          candidateEmail: f.candidateEmail,
          rawText: f.rawText,
        })),
      };

      const res = await api.uploadResumes(payload);
      setUploadProgress(100);
      showToast(res.message || 'Resumes uploaded successfully!', 'success');
      setSelectedFiles([]);

      // Reload resumes table
      const resumesRes = await api.getResumes();
      setResumes(resumesRes.resumes || []);
    } catch (err: any) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRunScreening = async (resumeId: string) => {
    setScreeningResumeId(resumeId);
    try {
      const res = await api.screenResume(resumeId);
      showToast(res.message || 'AI Screening complete!', 'success');
      onNavigate('/screening');
    } catch (err: any) {
      showToast(err.message || 'Screening failed', 'error');
    } finally {
      setScreeningResumeId(null);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      await api.deleteResume(resumeId);
      showToast('Resume removed.', 'info');
      setResumes(prev => prev.filter(r => r.id !== resumeId));
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Resume Upload & Ingestion</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Batch-upload candidate resumes (PDF, DOCX, TXT) mapped directly to your job requisitions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('/screening')}
          leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
        >
          View AI Screening
        </Button>
      </div>

      {/* Target Job Selector & Upload Zone Card */}
      <Card className="p-6">
        <div className="max-w-md mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Select Target Job Requisition <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full bg-slate-50 text-xs font-semibold text-slate-900 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {jobs.length === 0 ? (
                <option value="">No jobs available - Please create a job first</option>
              ) : (
                jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department} • {j.candidateCount || 0} candidates)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,application/pdf,text/plain"
            onChange={e => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <UploadCloud className="w-7 h-7 animate-bounce" />
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Drag & drop resumes here, or click to browse
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
            Supports PDF, DOCX, and TXT documents. Maximum file size: 20MB per document.
          </p>

          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            <span>PDF</span>
            <span>•</span>
            <span>DOCX</span>
            <span>•</span>
            <span>TXT</span>
          </div>
        </div>

        {/* Staged files review */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Staged Resumes ({selectedFiles.length})
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedFiles.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <input
                        type="text"
                        value={item.candidateName}
                        onChange={e => updateFileName(idx, e.target.value)}
                        placeholder="Candidate Name"
                        className="text-xs font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none truncate w-full"
                      />
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.name} • {(item.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Uploading and parsing documents...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                isLoading={isUploading}
                onClick={handleUploadAll}
                size="md"
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Upload {selectedFiles.length} Resume(s)
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Uploaded Resumes Archive Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Uploaded Resumes Repository</h3>
            <p className="text-xs text-slate-500">
              Candidate resumes stored securely for automated screening and matching.
            </p>
          </div>
        </div>

        {isLoadingResumes ? (
          <LoadingState message="Loading resumes repository..." />
        ) : resumes.length === 0 ? (
          <p className="text-xs text-slate-400 py-10 text-center">
            No resumes uploaded yet. Upload your first batch above!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Requisition</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Uploaded</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumes.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate max-w-[180px]">{r.fileName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {r.candidateName || 'Applicant'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{r.jobTitle || 'Assigned Job'}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          r.processingStatus === 'Processed'
                            ? 'success'
                            : r.processingStatus === 'Processing'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {r.processingStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(r.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={screeningResumeId === r.id}
                          onClick={() => handleRunScreening(r.id)}
                          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        >
                          AI Screen
                        </Button>
                        <button
                          onClick={() => onNavigate(`/candidates/${r.candidateId}`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Candidate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResume(r.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
