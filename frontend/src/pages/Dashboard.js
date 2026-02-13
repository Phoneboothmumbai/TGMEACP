import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { getActivationRequests, getStats, updateRequestStatus } from "@/lib/api";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  PlusCircle, 
  RefreshCw, 
  Eye, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  XCircle,
  Mail,
  FileText
} from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  email_sent: { label: "Email Sent", icon: Mail, className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
  payment_pending: { label: "Payment Pending", icon: CreditCard, className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  activated: { label: "Activated", icon: CheckCircle2, className: "bg-green-100 text-green-800 hover:bg-green-100" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, activated: 0, payment_pending: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        getActivationRequests(statusFilter === "all" ? null : statusFilter),
        getStats()
      ]);
      setRequests(requestsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await updateRequestStatus(requestId, newStatus);
      toast.success("Status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#86868B] uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="stats-grid">
        <StatCard title="Total Requests" value={stats.total} icon={FileText} color="bg-[#0071E3]" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="bg-amber-500" />
        <StatCard title="Payment Pending" value={stats.payment_pending} icon={CreditCard} color="bg-blue-500" />
        <StatCard title="Activated" value={stats.activated} icon={CheckCircle2} color="bg-green-500" />
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden" data-testid="requests-table-card">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-[#E8E8ED]">
          <div>
            <h2 className="text-lg font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">
              Activation Requests
            </h2>
            <p className="text-sm text-[#86868B] mt-0.5">Manage and track all AppleCare+ activations</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-[#F5F5F7] border-transparent" data-testid="status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="email_sent">Email Sent</SelectItem>
                <SelectItem value="payment_pending">Payment Pending</SelectItem>
                <SelectItem value="activated">Activated</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              className="hover:bg-[#F5F5F7]"
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Link to="/admin/new-request">
              <Button className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-5 gap-2" data-testid="new-request-btn">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New Request</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F5F7] hover:bg-[#F5F5F7]">
                <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Customer</TableHead>
                <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Serial Number</TableHead>
                <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Dealer</TableHead>
                <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Ticket ID</TableHead>
                <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-medium text-[#86868B] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-[#86868B]">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-[#D2D2D7]" />
                      <p className="text-[#86868B]">No activation requests found</p>
                      <Link to="/admin/new-request">
                        <Button className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-5 gap-2">
                          <PlusCircle className="w-4 h-4" />
                          Create First Request
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => {
                  const status = statusConfig[request.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={request.id} className="border-b border-[#E8E8ED] hover:bg-[#F5F5F7]/50 transition-colors" data-testid={`request-row-${request.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-[#1D1D1F]">{request.customer_name}</p>
                          <p className="text-xs text-[#86868B]">{request.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-sm text-[#1D1D1F] bg-[#F5F5F7] px-2 py-1 rounded">
                          {request.serial_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-[#1D1D1F]">{request.plan_name}</p>
                          <p className="text-xs text-[#86868B] font-mono">{request.plan_part_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-[#1D1D1F]">{request.dealer_name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-[#1D1D1F]">{request.device_activation_date}</p>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={request.status}
                          onValueChange={(value) => handleStatusChange(request.id, value)}
                        >
                          <SelectTrigger className="w-36 h-8 border-0 p-0">
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
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/request/${request.id}`}>
                          <Button variant="ghost" size="sm" className="hover:bg-[#F5F5F7] gap-1.5" data-testid={`view-request-${request.id}`}>
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
