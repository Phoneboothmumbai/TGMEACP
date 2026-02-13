import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { getSettings, updateSettings, getPlans, createPlan, updatePlan, deletePlan } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Mail, 
  Server, 
  Key, 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Lock,
  Save,
  RefreshCw,
  Upload,
  Download,
  FileSpreadsheet
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Settings() {
  const { changePassword } = useAuth();
  
  // Individual state for each settings field to prevent re-render issues
  const [appleEmail, setAppleEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [osticketUrl, setOsticketUrl] = useState("");
  const [osticketApiKey, setOsticketApiKey] = useState("");
  const [partnerName, setPartnerName] = useState("");
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  // Individual state for plan form
  const [planName, setPlanName] = useState("");
  const [planPartCode, setPlanPartCode] = useState("");
  const [planSku, setPlanSku] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planMrp, setPlanMrp] = useState("");
  
  // Individual state for password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, plansRes] = await Promise.all([
        getSettings(),
        getPlans(false)
      ]);
      const s = settingsRes.data;
      setAppleEmail(s.apple_email || "");
      setSmtpHost(s.smtp_host || "smtp.gmail.com");
      setSmtpPort(s.smtp_port || 587);
      setSmtpEmail(s.smtp_email || "");
      setSmtpPassword(s.smtp_password || "");
      setOsticketUrl(s.osticket_url || "");
      setOsticketApiKey(s.osticket_api_key || "");
      setPartnerName(s.partner_name || "");
      setPlans(plansRes.data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSettingsSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        apple_email: appleEmail,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_email: smtpEmail,
        smtp_password: smtpPassword,
        osticket_url: osticketUrl,
        osticket_api_key: osticketApiKey,
        partner_name: partnerName,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePlanSubmit = async () => {
    try {
      const submitData = {
        name: planName,
        part_code: planPartCode,
        sku: planSku,
        description: planDescription,
        mrp: planMrp ? parseFloat(planMrp) : null
      };
      if (editingPlan) {
        await updatePlan(editingPlan.id, submitData);
        toast.success("Plan updated");
      } else {
        await createPlan(submitData);
        toast.success("Plan created");
      }
      setPlanDialogOpen(false);
      resetPlanForm();
      setEditingPlan(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to save plan");
    }
  };

  const handlePlanDelete = async (planId) => {
    if (!window.confirm("Are you sure you want to deactivate this plan?")) return;
    try {
      await deletePlan(planId);
      toast.success("Plan deactivated");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const resetPlanForm = () => {
    setPlanName("");
    setPlanPartCode("");
    setPlanSku("");
    setPlanDescription("");
    setPlanMrp("");
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanName(plan.name || "");
    setPlanPartCode(plan.part_code || "");
    setPlanSku(plan.sku || "");
    setPlanDescription(plan.description || "");
    setPlanMrp(plan.mrp ? plan.mrp.toString() : "");
    setPlanDialogOpen(true);
  };

  const openNewPlan = () => {
    setEditingPlan(null);
    resetPlanForm();
    setPlanDialogOpen(true);
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/plans/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success(`Successfully uploaded ${response.data.imported_count} plans`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload plans");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleFile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/plans/sample`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'applecare_plans_sample.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download sample file");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0071E3]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="settings-page">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">Settings</h1>
          <p className="text-[#86868B] mt-1">Manage application configuration</p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="bg-[#F5F5F7] p-1 rounded-lg">
            <TabsTrigger value="email" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Email Configuration
            </TabsTrigger>
            <TabsTrigger value="tgme" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              TGME Support Ticket
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              AppleCare+ Plans
            </TabsTrigger>
            <TabsTrigger value="password" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Change Password
            </TabsTrigger>
          </TabsList>

          {/* Email Configuration */}
          <TabsContent value="email">
            <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-6" data-testid="email-settings-card">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">Email Configuration</h3>
                  <p className="text-sm text-[#86868B] mt-1">Configure SMTP settings for sending activation emails to Apple</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                      Apple Email IDs (Recipients)
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-[#86868B]" />
                      <Textarea
                        value={appleEmail}
                        onChange={(e) => setAppleEmail(e.target.value)}
                        placeholder="Enter email addresses separated by commas&#10;e.g., apple1@apple.com, apple2@apple.com"
                        className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg min-h-[80px] resize-none"
                        data-testid="apple-email-input"
                      />
                    </div>
                    <p className="text-xs text-[#86868B]">Separate multiple email addresses with commas</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                      Partner Name
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                      <Input
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Your company name"
                        className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                        data-testid="partner-name-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8E8ED]">
                  <h4 className="text-sm font-medium text-[#1D1D1F] mb-4">SMTP Settings (for sending emails)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                        SMTP Host
                      </Label>
                      <div className="relative">
                        <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                        <Input
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                          data-testid="smtp-host-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                        SMTP Port
                      </Label>
                      <Input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                        placeholder="587"
                        className="bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                        data-testid="smtp-port-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                        SMTP Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                        <Input
                          type="email"
                          value={smtpEmail}
                          onChange={(e) => setSmtpEmail(e.target.value)}
                          placeholder="your-email@gmail.com"
                          className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                          data-testid="smtp-email-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                        SMTP Password / App Password
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                        <Input
                          type="password"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          placeholder="Enter app password"
                          className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                          data-testid="smtp-password-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#E8E8ED]">
                  <Button
                    onClick={handleSettingsSave}
                    disabled={saving}
                    className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 gap-2"
                    data-testid="save-email-settings-btn"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TGME Support Ticket Configuration */}
          <TabsContent value="tgme">
            <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-6" data-testid="tgme-settings-card">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">TGME Support Ticket Configuration</h3>
                  <p className="text-sm text-[#86868B] mt-1">Configure TGME Support Ticket API for automatic ticket creation</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                      TGME Support Ticket URL
                    </Label>
                    <div className="relative">
                      <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                      <Input
                        value={osticketUrl}
                        onChange={(e) => setOsticketUrl(e.target.value)}
                        placeholder="https://your-support-ticket.com"
                        className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                        data-testid="tgme-url-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                      TGME Support Ticket API Key
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                      <Input
                        type="password"
                        value={osticketApiKey}
                        onChange={(e) => setOsticketApiKey(e.target.value)}
                        placeholder="Enter API key"
                        className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                        data-testid="tgme-api-key-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#E8E8ED]">
                  <Button
                    onClick={handleSettingsSave}
                    disabled={saving}
                    className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 gap-2"
                    data-testid="save-tgme-settings-btn"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Plans Management */}
          <TabsContent value="plans">
            <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden" data-testid="plans-settings-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-[#E8E8ED]">
                <div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">AppleCare+ Plans</h3>
                  <p className="text-sm text-[#86868B] mt-1">Manage available AppleCare+ plans</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={downloadSampleFile}
                    className="rounded-full px-4 gap-2 text-sm"
                    data-testid="download-sample-btn"
                  >
                    <Download className="w-4 h-4" />
                    Sample
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                    data-testid="excel-upload-input"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-full px-4 gap-2 text-sm"
                    data-testid="upload-excel-btn"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload Excel"}
                  </Button>
                  <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={openNewPlan}
                        className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-5 gap-2"
                        data-testid="add-plan-btn"
                      >
                        <Plus className="w-4 h-4" />
                        Add Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Plan" : "Add New Plan"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                              SKU
                            </Label>
                            <Input
                              value={planSku}
                              onChange={(e) => setPlanSku(e.target.value)}
                              placeholder="e.g., S9732ZM/A"
                              className="bg-[#F5F5F7] border-transparent focus:border-[#0071E3] font-mono"
                              data-testid="plan-sku-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                              Part Code
                            </Label>
                            <Input
                              value={planPartCode}
                              onChange={(e) => setPlanPartCode(e.target.value)}
                              placeholder="e.g., SR182HN/A"
                              className="bg-[#F5F5F7] border-transparent focus:border-[#0071E3] font-mono"
                              data-testid="plan-partcode-input"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                            Plan Name
                          </Label>
                          <Input
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            placeholder="e.g., AppleCare+ for iPhone"
                            className="bg-[#F5F5F7] border-transparent focus:border-[#0071E3]"
                            data-testid="plan-name-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                            Description
                          </Label>
                          <Input
                            value={planDescription}
                            onChange={(e) => setPlanDescription(e.target.value)}
                            placeholder="Plan description"
                            className="bg-[#F5F5F7] border-transparent focus:border-[#0071E3]"
                            data-testid="plan-description-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                            MRP (₹)
                          </Label>
                          <Input
                            type="number"
                            value={planMrp}
                            onChange={(e) => setPlanMrp(e.target.value)}
                            placeholder="e.g., 14900"
                            className="bg-[#F5F5F7] border-transparent focus:border-[#0071E3]"
                            data-testid="plan-mrp-input"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button variant="ghost" onClick={() => setPlanDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handlePlanSubmit}
                            className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6"
                            data-testid="save-plan-btn"
                          >
                            {editingPlan ? "Update" : "Create"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F5F7] hover:bg-[#F5F5F7]">
                    <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">SKU</TableHead>
                    <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Description</TableHead>
                    <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">MRP</TableHead>
                    <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Part Code</TableHead>
                    <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-[#86868B]">
                        No plans found. Add a new plan or upload an Excel file.
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((plan) => (
                      <TableRow key={plan.id} className="border-b border-[#E8E8ED] hover:bg-[#F5F5F7]/50" data-testid={`plan-row-${plan.id}`}>
                        <TableCell>
                          <code className="font-mono text-sm bg-[#F5F5F7] px-2 py-1 rounded">{plan.sku || plan.part_code}</code>
                        </TableCell>
                        <TableCell className="text-[#1D1D1F] max-w-xs truncate">{plan.description || plan.name}</TableCell>
                        <TableCell className="text-[#1D1D1F] font-medium">
                          {plan.mrp ? `₹${plan.mrp.toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell>
                          <code className="font-mono text-xs text-[#86868B]">{plan.part_code}</code>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {plan.active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditPlan(plan)}
                              className="hover:bg-[#F5F5F7]"
                              data-testid={`edit-plan-${plan.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {plan.active && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePlanDelete(plan.id)}
                                className="hover:bg-red-50 text-red-500"
                                data-testid={`delete-plan-${plan.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Change Password */}
          <TabsContent value="password">
            <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-6 max-w-md" data-testid="password-settings-card">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">Change Password</h3>
                  <p className="text-sm text-[#86868B] mt-1">Update your account password</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                        required
                        data-testid="current-password-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                        required
                        data-testid="new-password-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                        required
                        data-testid="confirm-password-input"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full h-11 gap-2"
                    data-testid="change-password-btn"
                  >
                    <Lock className="w-4 h-4" />
                    {passwordLoading ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
