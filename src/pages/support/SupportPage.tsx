import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge, Input, Select } from '../../components/common/UIComponents';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  message: string;
}

export const SupportPage: React.FC = () => {
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [form, setForm] = useState({
    name: 'Sarah Connor',
    email: 'recruiter@trusthire.ai',
    subject: '',
    category: 'Technical',
    message: '',
  });

  useEffect(() => {
    async function loadTickets() {
      try {
        const res = await api.getSupportTickets();
        setTickets(res.tickets || []);
      } catch (err) {
        // Fallback demo tickets
        setTickets([
          {
            id: 't-1',
            subject: 'Inquiry regarding custom credential verification API',
            category: 'Verification',
            status: 'Resolved',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            message: 'How can our team connect an internal university alumni registry?',
          },
          {
            id: 't-2',
            subject: 'Assistance with batch resume parsing timeout',
            category: 'Technical',
            status: 'In Progress',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            message: 'Looking to clarify maximum batch document upload limits.',
          },
        ]);
      }
    }
    loadTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      showToast('Subject and message are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitSupportTicket(form);
      showToast(res.message || 'Support inquiry submitted successfully!', 'success');
      setTickets(prev => [res.ticket, ...prev]);
      setForm(prev => ({ ...prev, subject: '', message: '' }));
    } catch (err: any) {
      showToast(err.message || 'Failed to submit inquiry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How does Gemini AI evaluate resume alignment against job requisitions?',
      a: 'TrustHire AI uses the Google Gemini 3.8 Flash model via our secure backend. The model conducts multidimensional semantic analysis comparing technical skills, soft skills, relevant work experience, and educational credentials against your specified criteria. It outputs an objective match score (0-100%), explicit matched skills, and identified skill gaps without automated hiring rejections.',
    },
    {
      q: 'Are automated hiring or rejection decisions made by the AI?',
      a: 'Never. TrustHire AI strictly adheres to human-in-the-loop ethical AI standards. The platform serves as an algorithmic decision-support tool providing transparent evaluation data and suggestions. Final shortlist, interview, and hiring determinations remain completely under recruiter authority.',
    },
    {
      q: 'How does the Certificate Verification module work?',
      a: 'The system extracts metadata (issuing body, credential ID, issue date, and specialization) from submitted diplomas and certifications. Recruiters can audit these credentials against issuing registries or digital badge providers, logging verification evidence and marking items as Verified, Needs Manual Review, or Unable to Verify.',
    },
    {
      q: 'Is candidate personal information protected and private?',
      a: 'Yes. All candidate data is securely partitioned under role-based authorization. Only authorized recruiters and administrators can view candidate records and evaluation scores. API keys and AI processing occur solely through our protected backend proxy.',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Help & Recruiter Support
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Knowledge base, algorithmic screening guidance, and dedicated technical assistance.
        </p>
      </div>

      {/* Recruiter Workflow Quick Guide */}
      <Card className="p-6 bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-white border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">TrustHire AI 4-Step Recruiter Workflow</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-1">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center mb-2">
              1
            </span>
            <h4 className="font-bold text-slate-900">Define Requisition</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Create a job or use Gemini AI JD Parsing to automatically extract required skills and requirements.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-1">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center mb-2">
              2
            </span>
            <h4 className="font-bold text-slate-900">Batch Ingest Resumes</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Upload PDF, DOCX, or TXT applicant resumes mapped to your active job requisitions.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-1">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[11px] flex items-center justify-center mb-2">
              3
            </span>
            <h4 className="font-bold text-slate-900">Transparent AI Screen</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Gemini calculates alignment scores, highlighting matched strengths and missing skills gaps.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-1">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center mb-2">
              4
            </span>
            <h4 className="font-bold text-slate-900">Audit & Shortlist</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Verify degree authenticity, record internal recruiter notes, and tag top talent for interviews.
            </p>
          </div>
        </div>
      </Card>

      {/* Main Row: Submit Ticket Form & FAQ Accordion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Support Request Form */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Submit an Inquiry</h3>
              <p className="text-xs text-slate-500">Reach our product engineers and compliance team</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Your Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Work Email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Subject"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief summary of inquiry"
                required
              />
              <Select
                label="Category"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                options={[
                  { value: 'Technical', label: 'Technical / Platform Error' },
                  { value: 'Verification', label: 'Credential Verification' },
                  { value: 'Account', label: 'Account / Billing' },
                  { value: 'General', label: 'General / Feature Request' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Message
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={4}
                placeholder="Describe your question or issue in detail..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full"
            >
              Submit Inquiry
            </Button>
          </form>
        </Card>

        {/* FAQs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <Card
                  key={idx}
                  className="p-4 cursor-pointer transition-colors"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{faq.q}</h4>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                  {isOpen && (
                    <p className="text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-100 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submitted Inquiries List */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Your Recent Support Tickets</h3>
        {tickets.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No active support inquiries.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{t.subject}</span>
                    <Badge
                      variant={
                        t.status === 'Resolved'
                          ? 'success'
                          : t.status === 'In Progress'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-1">{t.message}</p>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">
                  {new Date(t.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
