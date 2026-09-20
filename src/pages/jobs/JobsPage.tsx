import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Edit2,
  Trash2,
  UploadCloud,
  ArrowRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Job, JobStatus, EmploymentType } from '../../types';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  LoadingState,
  EmptyState,
  ConfirmDialog,
} from '../../components/common/UIComponents';

interface JobsPageProps {
  onNavigate: (path: string) => void;
}

export const JobsPage: React.FC<JobsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // AI JD Parser state
  const [isAIParsing, setIsAIParsing] = useState(false);
  const [jdRawText, setJdRawText] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Delete dialog state
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  // Form State
  const initialForm = {
    title: '',
    department: '',
    location: 'Remote',
    employmentType: 'Full Time' as EmploymentType,
    experienceRequired: '3+ years',
    educationRequired: "Bachelor's degree or equivalent",
    requiredSkills: '',
    preferredSkills: '',
    salaryRange: '$120,000 - $150,000',
    description: '',
    responsibilities: '',
    status: 'Active' as JobStatus,
  };
  const [formData, setFormData] = useState(initialForm);

  const loadJobs = async () => {
    try {
      const res = await api.getJobs();
      setJobs(res.jobs || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load jobs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const openCreateModal = () => {
    setEditingJob(null);
    setFormData(initialForm);
    setShowAIPanel(false);
    setJdRawText('');
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      experienceRequired: job.experienceRequired,
      educationRequired: job.educationRequired,
      requiredSkills: job.requiredSkills.join(', '),
      preferredSkills: job.preferredSkills.join(', '),
      salaryRange: job.salaryRange,
      description: job.description,
      responsibilities: job.responsibilities,
      status: job.status,
    });
    setShowAIPanel(false);
    setIsModalOpen(true);
  };

  const handleAIExtract = async () => {
    if (!jdRawText || jdRawText.trim().length < 20) {
      showToast('Please paste a job description of at least 20 characters.', 'warning');
      return;
    }
    setIsAIParsing(true);
    try {
      const res = await api.parseJDWithAI(jdRawText);
      const ext = res.extracted;
      setFormData(prev => ({
        ...prev,
        title: ext.title || prev.title,
        department: ext.department || prev.department,
        location: ext.location || prev.location,
        employmentType: ext.employmentType || prev.employmentType,
        experienceRequired: ext.experienceRequired || prev.experienceRequired,
        educationRequired: ext.educationRequired || prev.educationRequired,
        requiredSkills: Array.isArray(ext.requiredSkills) ? ext.requiredSkills.join(', ') : prev.requiredSkills,
        preferredSkills: Array.isArray(ext.preferredSkills) ? ext.preferredSkills.join(', ') : prev.preferredSkills,
        salaryRange: ext.salaryRange || prev.salaryRange,
        description: ext.description || prev.description,
        responsibilities: ext.responsibilities || prev.responsibilities,
      }));
      setShowAIPanel(false);
      showToast('Job details extracted successfully with Gemini!', 'success');
    } catch (err: any) {
      showToast(err.message || 'AI extraction failed', 'error');
    } finally {
      setIsAIParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.department) {
      showToast('Title and department are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        preferredSkills: formData.preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (editingJob) {
        await api.updateJob(editingJob.id, payload);
        showToast('Job updated successfully.', 'success');
      } else {
        await api.createJob(payload);
        showToast('Job requisition created successfully.', 'success');
      }
      setIsModalOpen(false);
      loadJobs();
    } catch (err: any) {
      showToast(err.message || 'Failed to save job.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      await api.deleteJob(jobToDelete.id);
      showToast('Job deleted.', 'success');
      setJobToDelete(null);
      loadJobs();
    } catch (err: any) {
      showToast(err.message || 'Could not delete job', 'error');
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.requiredSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Job Requisitions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage hiring positions, skill criteria, and Gemini JD parsing.
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          Post New Job
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
            placeholder="Search by job title, department, or required skill..."
            className="w-full bg-slate-50 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 text-xs font-semibold text-slate-700 py-2 px-3 rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <LoadingState message="Fetching active jobs..." />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          description="Create your first job requisition or adjust your search filters to view positions."
          actionText="Create Job"
          onAction={openCreateModal}
          icon={<Briefcase className="w-6 h-6 text-blue-600" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map(job => (
            <Card key={job.id} hoverable className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {job.department}
                  </span>
                  <Badge
                    variant={
                      job.status === 'Active' ? 'success' : job.status === 'Draft' ? 'warning' : 'neutral'
                    }
                  >
                    {job.status}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">{job.title}</h3>

                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>{job.employmentType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Exp: {job.experienceRequired}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.salaryRange}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Required Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.slice(0, 4).map(skill => (
                      <span
                        key={skill}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                        +{job.requiredSkills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{job.candidateCount || 0} Candidates</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onNavigate(`/resumes/upload?jobId=${job.id}`)}
                    title="Upload resumes for this job"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <UploadCloud className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(job)}
                    title="Edit job"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setJobToDelete(job)}
                    title="Delete job"
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate(`/matching?jobId=${job.id}`)}
                    className="ml-1 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                  >
                    Matches <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Job Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJob ? 'Edit Job Requisition' : 'Create Job Requisition'}
        description="Specify job requirements, experience, and skills criteria."
        maxWidth="2xl"
      >
        {/* AI Parse JD accordion */}
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">Auto-fill with Gemini AI JD Parser</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              {showAIPanel ? 'Hide' : 'Paste JD Text'}
            </button>
          </div>

          {showAIPanel && (
            <div className="mt-3 space-y-2">
              <textarea
                value={jdRawText}
                onChange={e => setJdRawText(e.target.value)}
                placeholder="Paste the raw text of your Job Description here... Gemini will automatically extract title, skills, experience, and responsibilities."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-blue-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <Button
                size="sm"
                variant="primary"
                isLoading={isAIParsing}
                onClick={handleAIExtract}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Extract Details with Gemini
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Full Stack Engineer"
              required
            />
            <Input
              label="Department"
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. Engineering, Product, Sales"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Location"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Remote / New York, NY"
            />
            <Select
              label="Employment Type"
              value={formData.employmentType}
              onChange={e => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
              options={[
                { value: 'Full Time', label: 'Full Time' },
                { value: 'Part Time', label: 'Part Time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Internship', label: 'Internship' },
              ]}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as JobStatus })}
              options={[
                { value: 'Active', label: 'Active (Open for applications)' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Closed', label: 'Closed' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Experience Required"
              value={formData.experienceRequired}
              onChange={e => setFormData({ ...formData, experienceRequired: e.target.value })}
              placeholder="e.g. 3+ years"
            />
            <Input
              label="Education Required"
              value={formData.educationRequired}
              onChange={e => setFormData({ ...formData, educationRequired: e.target.value })}
              placeholder="e.g. Bachelor's in CS"
            />
            <Input
              label="Salary Range"
              value={formData.salaryRange}
              onChange={e => setFormData({ ...formData, salaryRange: e.target.value })}
              placeholder="e.g. $130,000 - $160,000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Required Skills (Comma-separated)
            </label>
            <Input
              value={formData.requiredSkills}
              onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
              placeholder="React, TypeScript, Node.js, PostgreSQL, Docker"
              helperText="These skills form the primary matching baseline for AI resume screening."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Preferred / Nice-to-have Skills
            </label>
            <Input
              value={formData.preferredSkills}
              onChange={e => setFormData({ ...formData, preferredSkills: e.target.value })}
              placeholder="AWS, GraphQL, Kubernetes, Tailwind CSS"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Job Description Overview
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Detailed description of the mission, role expectations, and company culture..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Key Responsibilities
            </label>
            <textarea
              value={formData.responsibilities}
              onChange={e => setFormData({ ...formData, responsibilities: e.target.value })}
              rows={3}
              placeholder="Core duties, project deliverables, and team responsibilities..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              {editingJob ? 'Save Changes' : 'Create Job'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Job Requisition"
        message={`Are you sure you want to delete "${jobToDelete?.title}"? Associated screening results will remain in archive.`}
        confirmText="Delete Job"
        isDestructive
      />
    </div>
  );
};
