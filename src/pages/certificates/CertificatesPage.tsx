import React, { useState, useEffect } from 'react';
import {
  Award,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Calendar,
  Building,
  Hash,
  Search,
  Filter,
  Eye,
  Edit2,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Certificate, CertificateStatus, Candidate } from '../../types';
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  LoadingState,
  EmptyState,
} from '../../components/common/UIComponents';

interface CertificatesPageProps {
  onNavigate: (path: string) => void;
}

export const CertificatesPage: React.FC<CertificatesPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    candidateId: '',
    certificateName: '',
    issuingOrganization: '',
    certificateId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    course: '',
    skills: '',
  });

  // Verify / Review Modal State
  const [reviewCert, setReviewCert] = useState<Certificate | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<CertificateStatus>('Verified');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = async () => {
    try {
      const [certsRes, candRes] = await Promise.all([api.getCertificates(), api.getCandidates()]);
      setCertificates(certsRes.certificates || []);
      setCandidates(candRes.candidates || []);
      if (candRes.candidates?.length > 0 && !uploadForm.candidateId) {
        setUploadForm(prev => ({ ...prev, candidateId: candRes.candidates[0].id }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load certificates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.candidateId || !uploadForm.certificateName) {
      showToast('Candidate and Certificate Name are required.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.uploadCertificate({
        ...uploadForm,
        skills: uploadForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      showToast('Certificate recorded successfully.', 'success');
      setIsUploadModalOpen(false);
      setUploadForm({
        candidateId: candidates[0]?.id || '',
        certificateName: '',
        issuingOrganization: '',
        certificateId: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        course: '',
        skills: '',
      });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (cert: Certificate) => {
    setReviewCert(cert);
    setVerificationStatus(cert.status);
    setEvidenceNotes(cert.evidence || '');
    setReviewerNotes(cert.reviewerNotes || '');
  };

  const handleStatusUpdate = async () => {
    if (!reviewCert) return;
    setIsUpdatingStatus(true);
    try {
      await api.verifyCertificate(reviewCert.id, {
        status: verificationStatus,
        evidence: evidenceNotes,
        reviewerNotes,
      });
      showToast('Verification status updated.', 'success');
      setReviewCert(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredCerts = certificates.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.certificateName.toLowerCase().includes(q) ||
      (c.candidateName && c.candidateName.toLowerCase().includes(q)) ||
      c.issuingOrganization.toLowerCase().includes(q) ||
      c.certificateId.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CertificateStatus) => {
    switch (status) {
      case 'Verified':
        return <Badge variant="success">Verified Authentic</Badge>;
      case 'Needs Manual Review':
        return <Badge variant="warning">Needs Manual Review</Badge>;
      case 'Pending':
        return <Badge variant="info">Verification Pending</Badge>;
      case 'Unable to Verify':
        return <Badge variant="error">Unable to Verify</Badge>;
      case 'Expired':
        return <Badge variant="neutral">Expired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Certificate & Credential Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit candidate educational degrees, certifications, and issuing registry evidence.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<UploadCloud className="w-4 h-4" />}
          onClick={() => setIsUploadModalOpen(true)}
        >
          Add Certificate
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search certificate title, issuing organization, candidate name, or ID..."
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
            <option value="ALL">All Verification Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Needs Manual Review">Needs Manual Review</option>
            <option value="Pending">Pending</option>
            <option value="Unable to Verify">Unable to Verify</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      {isLoading ? (
        <LoadingState message="Loading credential verification records..." />
      ) : filteredCerts.length === 0 ? (
        <EmptyState
          title="No certificates on record"
          description="Upload candidate certificates to verify credentials against issuing organizations."
          actionText="Upload Certificate"
          onAction={() => setIsUploadModalOpen(true)}
          icon={<Award className="w-6 h-6 text-teal-600" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCerts.map(cert => (
            <Card key={cert.id} hoverable className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider truncate">
                    {cert.issuingOrganization}
                  </span>
                  {getStatusBadge(cert.status)}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                  {cert.certificateName}
                </h3>
                <p className="text-xs text-blue-600 font-semibold mb-3">
                  Candidate: {cert.candidateName || 'Applicant'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-700 font-medium">
                      {cert.certificateId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Issued: {cert.issueDate}</span>
                    {cert.expiryDate && <span>• Exp: {cert.expiryDate}</span>}
                  </div>
                </div>

                {cert.evidence && (
                  <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-[11px] text-slate-700 mb-3 leading-relaxed">
                    <span className="font-bold text-blue-900 block mb-0.5">Verification Evidence:</span>
                    {cert.evidence}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigate(`/candidates/${cert.candidateId}`)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Candidate
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openReviewModal(cert)}
                  leftIcon={<Edit2 className="w-3 h-3" />}
                >
                  Audit / Verify
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Certificate Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Add Candidate Certificate"
        description="Register an educational degree or professional certification for audit."
        maxWidth="lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Candidate <span className="text-rose-500">*</span>
            </label>
            <select
              value={uploadForm.candidateId}
              onChange={e => setUploadForm({ ...uploadForm, candidateId: e.target.value })}
              className="w-full bg-slate-50 text-xs font-semibold text-slate-900 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            >
              {candidates.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Certificate Name"
              value={uploadForm.certificateName}
              onChange={e => setUploadForm({ ...uploadForm, certificateName: e.target.value })}
              placeholder="e.g. AWS Solutions Architect Associate"
              required
            />
            <Input
              label="Issuing Organization"
              value={uploadForm.issuingOrganization}
              onChange={e => setUploadForm({ ...uploadForm, issuingOrganization: e.target.value })}
              placeholder="e.g. Amazon Web Services, Coursera"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Certificate / Credential ID"
              value={uploadForm.certificateId}
              onChange={e => setUploadForm({ ...uploadForm, certificateId: e.target.value })}
              placeholder="e.g. AWS-948291"
            />
            <Input
              label="Issue Date"
              type="date"
              value={uploadForm.issueDate}
              onChange={e => setUploadForm({ ...uploadForm, issueDate: e.target.value })}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={uploadForm.expiryDate}
              onChange={e => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
            />
          </div>

          <Input
            label="Verified Skills (Comma-separated)"
            value={uploadForm.skills}
            onChange={e => setUploadForm({ ...uploadForm, skills: e.target.value })}
            placeholder="e.g. Cloud Architecture, S3, EC2, IAM, Security"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Certificate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review / Update Verification Status Modal */}
      <Modal
        isOpen={!!reviewCert}
        onClose={() => setReviewCert(null)}
        title="Audit & Update Credential Status"
        description={reviewCert?.certificateName || ''}
        maxWidth="md"
      >
        {reviewCert && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Verification Status
              </label>
              <select
                value={verificationStatus}
                onChange={e => setVerificationStatus(e.target.value as CertificateStatus)}
                className="w-full bg-slate-50 text-xs font-semibold text-slate-900 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Verified">Verified Authentic (Validated registry ID)</option>
                <option value="Needs Manual Review">Needs Manual Review (Ambiguous issuer)</option>
                <option value="Pending">Pending (Awaiting registry confirmation)</option>
                <option value="Unable to Verify">Unable to Verify (Invalid credential ID)</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Verification Evidence / Registry Link
              </label>
              <textarea
                value={evidenceNotes}
                onChange={e => setEvidenceNotes(e.target.value)}
                rows={2}
                placeholder="Confirmed against official registry database or digital badge provider..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reviewer Internal Notes
              </label>
              <textarea
                value={reviewerNotes}
                onChange={e => setReviewerNotes(e.target.value)}
                rows={2}
                placeholder="Private recruiter or audit assessment notes..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewCert(null)}
              >
                Cancel
              </Button>
              <Button size="sm" isLoading={isUpdatingStatus} onClick={handleStatusUpdate}>
                Save Decision
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
