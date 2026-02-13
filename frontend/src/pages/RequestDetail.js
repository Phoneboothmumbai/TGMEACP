import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { getActivationRequest, updateRequestStatus, resendEmail, getInvoiceUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Mail, 
  Download, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  XCircle,
  User,
  Phone,
  Building2,
  Smartphone,
  Hash,
  Calendar,
  FileText
} from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-800" },
  email_sent: { label: "Email Sent", icon: Mail, className: "bg-purple-100 text-purple-800" },
  payment_pending: { label: "Payment Pending", icon: CreditCard, className: "bg-blue-100 text-blue-800" },
  activated: { label: "Activated", icon: CheckCircle2, className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-red-100 text-red-800" },
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const response = await getActivationRequest(id);
      setRequest(response.data);
    } catch (error) {
      toast.error("Failed to load request");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateRequestStatus(id, newStatus);
      toast.success("Status updated");
      fetchRequest();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await resendEmail(id);
      toast.success("Email resend queued");
    } catch (error) {
      toast.error("Failed to resend email");
    } finally {
      setResending(false);
    }
  };

  const handleDownloadInvoice = () => {
    const url = getInvoiceUrl(id);
    window.open(`${url}?authorization=Bearer ${token}`, "_blank");
  };

  if (loading) {
    return (
      <DashboardLayout title="Request Details">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-[#86868B]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout title="Request Details">
        <div className="text-center py-12">
          <p className="text-[#86868B]">Request not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
    <div className="flex items-start gap-4 py-3 border-b border-[#E8E8ED] last:border-0">
      <div className="w-10 h-10 rounded-lg bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#86868B]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#86868B] uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-[#1D1D1F] ${mono ? "font-mono text-sm" : ""}`}>{value || "-"}</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Request Details">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="hover:bg-[#F5F5F7]" data-testid="back-btn">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">
                {request.customer_name}
              </h2>
              <p className="text-sm text-[#86868B]">Request ID: {request.id.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={request.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-44 border-0" data-testid="status-select">
                <Badge className={`${status.className} font-medium gap-1.5`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleResendEmail}
            disabled={resending}
            variant="outline"
            className="gap-2"
            data-testid="resend-email-btn"
          >
            {resending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Resend Email to Apple
          </Button>
          <Button
            onClick={handleDownloadInvoice}
            variant="outline"
            className="gap-2"
            data-testid="download-invoice-btn"
          >
            <Download className="w-4 h-4" />
            Download Invoice
          </Button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-6" data-testid="customer-info-card">
            <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider mb-4">
              Customer Information
            </h3>
            <div className="space-y-1">
              <InfoRow icon={User} label="Customer Name" value={request.customer_name} />
              <InfoRow icon={Mail} label="Customer Email" value={request.customer_email} />
              <InfoRow icon={Phone} label="Customer Mobile" value={request.customer_mobile} />
            </div>
          </div>

          {/* Dealer Information */}
          <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-6" data-testid="dealer-info-card">
            <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider mb-4">
              Dealer Information
            </h3>
            <div className="space-y-1">
              <InfoRow icon={Building2} label="Dealer Name" value={request.dealer_name} />
              <InfoRow icon={Phone} label="Dealer Mobile" value={request.dealer_mobile} />
            </div>
          </div>

          {/* Device Information */}
          <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-6" data-testid="device-info-card">
            <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider mb-4">
              Device Information
            </h3>
            <div className="space-y-1">
              <InfoRow icon={Smartphone} label="Model ID" value={request.model_id} />
              <InfoRow icon={Hash} label="Serial Number / IMEI" value={request.serial_number} mono />
              <InfoRow icon={Calendar} label="Device Activation Date" value={request.device_activation_date} />
              <InfoRow icon={Building2} label="Billing Location" value={request.billing_location} />
              <InfoRow icon={CreditCard} label="Payment Type" value={request.payment_type} />
            </div>
          </div>

          {/* Plan Information */}
          <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-6" data-testid="plan-info-card">
            <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider mb-4">
              Plan Information
            </h3>
            <div className="space-y-1">
              <InfoRow icon={FileText} label="Plan Name" value={request.plan_name} />
              <InfoRow icon={Hash} label="Part Code" value={request.plan_part_code} mono />
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8E8ED]">
              <h4 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-3">
                Status Indicators
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant={request.email_sent ? "default" : "secondary"} className={request.email_sent ? "bg-green-100 text-green-800" : ""}>
                  {request.email_sent ? "Email Sent" : "Email Not Sent"}
                </Badge>
                <Badge variant={request.osticket_id ? "default" : "secondary"} className={request.osticket_id ? "bg-green-100 text-green-800" : ""}>
                  {request.osticket_id ? `Ticket: ${request.osticket_id}` : "No Ticket"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-[#F5F5F7] rounded-xl p-4">
          <div className="flex flex-wrap gap-6 text-sm text-[#86868B]">
            <span>Created: {new Date(request.created_at).toLocaleString()}</span>
            <span>Updated: {new Date(request.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
