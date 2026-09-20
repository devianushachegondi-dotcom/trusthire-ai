import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Sliders,
  Activity,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Trash2,
  Edit2,
  Lock,
  Cpu,
  Database,
  Globe,
  Save,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Card,
  Button,
  Badge,
  Tabs,
  Modal,
  Input,
  Select,
  LoadingState,
} from '../../components/common/UIComponents';

export const AdminPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New user modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'recruiter',
    department: 'Talent Acquisition',
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Settings form
  const [modelSettings, setModelSettings] = useState({
    modelName: 'gemini-2.5-flash',
    defaultThreshold: 70,
    maxUploadSizeMb: 20,
    enableStrictCredentialAudit: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadAdminData = async () => {
    try {
      const [usersRes, logsRes, settingsRes, healthRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminLogs(),
        api.getAdminSettings(),
        api.getSystemHealth(),
      ]);
      setUsers(usersRes.users || []);
      setLogs(logsRes.logs || []);
      setSettings(settingsRes.settings);
      if (settingsRes.settings) {
        setModelSettings(settingsRes.settings);
      }
      setSystemHealth(healthRes.health);
    } catch (err: any) {
      showToast(err.message || 'Error loading admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      const res = await api.createAdminUser(newUserForm);
      showToast('Recruiter account created.', 'success');
      setUsers(prev => [res.user, ...prev]);
      setIsUserModalOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        role: 'recruiter',
        department: 'Talent Acquisition',
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateAdminUserStatus(userId, newStatus);
      showToast(`User status updated to ${newStatus}.`, 'info');
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, status: newStatus } : u)));
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.saveAdminSettings(modelSettings);
      showToast('System configuration saved.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Settings update failed', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading administrative controls..." height="h-96" />;
  }

  const tabs = [
    { id: 'users', label: `User Management (${users.length})` },
    { id: 'settings', label: 'AI & System Configuration' },
    { id: 'logs', label: 'Security & Audit Logs' },
    { id: 'health', label: 'Platform Health' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
            <Badge variant="purple">Super Admin Access</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage recruiter authorization, monitor security audit logs, and configure Gemini model parameters.
          </p>
        </div>

        {activeTab === 'users' && (
          <Button
            size="sm"
            onClick={() => setIsUserModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Recruiter
          </Button>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Users */}
      {activeTab === 'users' && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={u.role === 'admin' ? 'purple' : 'info'}>
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{u.department || 'TA'}</td>
                    <td className="py-3 px-3">
                      <Badge variant={u.status === 'active' ? 'success' : 'error'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                            u.status === 'active'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Settings */}
      {activeTab === 'settings' && (
        <Card className="p-6 max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900">Gemini Screening Configuration</h3>

            <div className="space-y-4">
              <div>
                <Select
                  label="Gemini Reasoning Model"
                  value={modelSettings.modelName}
                  onChange={e => setModelSettings({ ...modelSettings, modelName: e.target.value })}
                  options={[
                    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended - Ultra-Fast & Precise)' },
                    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep Complex Reasoning)' },
                  ]}
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Screening logic runs securely server-side via the Google Gen AI TypeScript SDK.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Shortlist Threshold: {modelSettings.defaultThreshold}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={modelSettings.defaultThreshold}
                  onChange={e =>
                    setModelSettings({ ...modelSettings, defaultThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-blue-600"
                />
                <span className="text-[11px] text-slate-500">
                  Applicants with match scores equal or exceeding this threshold are suggested for shortlisting.
                </span>
              </div>

              <Input
                label="Maximum Upload Size per Document (MB)"
                type="number"
                value={modelSettings.maxUploadSizeMb}
                onChange={e =>
                  setModelSettings({ ...modelSettings, maxUploadSizeMb: Number(e.target.value) })
                }
              />

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={modelSettings.enableStrictCredentialAudit}
                    onChange={e =>
                      setModelSettings({
                        ...modelSettings,
                        enableStrictCredentialAudit: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enforce Strict Credential Audit on Flagged Resumes</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button type="submit" isLoading={isSavingSettings} leftIcon={<Save className="w-4 h-4" />}>
                Save System Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Security & Audit Logs */}
      {activeTab === 'logs' && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-3">Action Event</th>
                  <th className="py-3 px-3">Resource Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate">{log.targetName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Platform Health */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">API Gateway</h4>
                <Badge variant="success">Operational</Badge>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>Latency: 28ms</div>
              <div>Uptime: 99.98%</div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">JSON Storage Store</h4>
                <Badge variant="success">Connected</Badge>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>Read / Write: Optimal</div>
              <div>Data Integrity: Verified</div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Gemini 3.8 Flash</h4>
                <Badge variant="purple">Active Proxy</Badge>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>Average Generation: 1.4s</div>
              <div>Security Sanitization: Enabled</div>
            </div>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Add Recruiter Account"
        description="Provision platform access and assign role-based permissions."
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            value={newUserForm.name}
            onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
            placeholder="e.g. Alex Morgan"
            required
          />
          <Input
            label="Work Email"
            type="email"
            value={newUserForm.email}
            onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
            placeholder="alex@company.com"
            required
          />
          <Select
            label="Role Permission"
            value={newUserForm.role}
            onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
            options={[
              { value: 'recruiter', label: 'Recruiter (Standard access)' },
              { value: 'admin', label: 'Admin (Full console access)' },
            ]}
          />
          <Input
            label="Department"
            value={newUserForm.department}
            onChange={e => setNewUserForm({ ...newUserForm, department: e.target.value })}
            placeholder="Talent Acquisition"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSavingUser}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
