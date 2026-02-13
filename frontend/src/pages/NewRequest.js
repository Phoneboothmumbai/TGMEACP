import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { getPlans, createActivationRequest } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Check, 
  ChevronsUpDown, 
  User, 
  Phone, 
  Mail, 
  Smartphone, 
  Hash,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewRequest() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  // Individual state for each field to prevent re-render issues
  const [dealerName, setDealerName] = useState("");
  const [dealerMobile, setDealerMobile] = useState("");
  const [dealerEmail, setDealerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [modelId, setModelId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [planId, setPlanId] = useState("");
  const [activationDate, setActivationDate] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await getPlans();
        setPlans(response.data);
      } catch (error) {
        toast.error("Failed to load plans");
      }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!planId) {
      toast.error("Please select an AppleCare+ plan");
      return;
    }
    
    if (!activationDate) {
      toast.error("Please select the device activation date");
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        dealer_name: dealerName,
        dealer_mobile: dealerMobile,
        dealer_email: dealerEmail,
        customer_name: customerName,
        customer_mobile: customerMobile,
        customer_email: customerEmail,
        model_id: modelId,
        serial_number: serialNumber,
        plan_id: planId,
        device_activation_date: format(activationDate, "yyyy-MM-dd"),
      };
      await createActivationRequest(submitData);
      toast.success("Activation request created successfully");
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === planId);

  return (
    <DashboardLayout title="New Activation Request">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-8" data-testid="new-request-form-card">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Dealer Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider border-b border-[#E8E8ED] pb-2">
                Dealer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dealer_name" className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                    Dealer Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                    <Input
                      id="dealer_name"
                      value={dealerName}
                      onChange={(e) => setDealerName(e.target.value)}
                      placeholder="Enter dealer name"
                      required
                      className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                      data-testid="dealer-name-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dealer_mobile" className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                    Dealer Mobile
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                    <Input
                      id="dealer_mobile"
                      value={dealerMobile}
                      onChange={(e) => setDealerMobile(e.target.value)}
                      placeholder="Enter mobile number"
                      required
                      className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                      data-testid="dealer-mobile-input"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer_email" className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  Dealer Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                  <Input
                    id="dealer_email"
                    type="email"
                    value={dealerEmail}
                    onChange={(e) => setDealerEmail(e.target.value)}
                    placeholder="Enter dealer email"
                    required
                    className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                    data-testid="dealer-email-input"
                  />
                </div>
              </div>
            </div>

            {/* Customer Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider border-b border-[#E8E8ED] pb-2">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name" className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                    Customer Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                    <Input
                      id="customer_name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      required
                      className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                      data-testid="customer-name-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_mobile" className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                    Customer Mobile
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                    <Input
                      id="customer_mobile"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      placeholder="Enter mobile number"
                      required
                      className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                      data-testid="customer-mobile-input"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email" className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  Customer Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                  <Input
                    id="customer_email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                    className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                    data-testid="customer-email-input"
                  />
                </div>
              </div>
            </div>

            {/* Device Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider border-b border-[#E8E8ED] pb-2">
                Device Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model_id" className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                    Model ID
                  </Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                    <Input
                      id="model_id"
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                      placeholder="e.g., iPhone 15 Pro Max"
                      required
                      className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                      data-testid="model-id-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number" className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                    Serial Number / IMEI
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                    <Input
                      id="serial_number"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="Enter serial number"
                      required
                      className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
                      data-testid="serial-number-input"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  AppleCare+ Plan
                </Label>
                <Popover open={planOpen} onOpenChange={setPlanOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={planOpen}
                      className="w-full justify-between bg-[#F5F5F7] border-transparent hover:bg-[#E8E8ED] h-11"
                      data-testid="plan-select-btn"
                    >
                      {selectedPlan ? (
                        <span className="text-sm truncate">
                          {selectedPlan.sku || selectedPlan.part_code} - {selectedPlan.description || selectedPlan.name} {selectedPlan.mrp ? `(₹${selectedPlan.mrp.toLocaleString('en-IN')})` : ''}
                        </span>
                      ) : (
                        <span className="text-[#86868B]">Select a plan...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search plans..." data-testid="plan-search-input" />
                      <CommandList>
                        <CommandEmpty>No plan found.</CommandEmpty>
                        <CommandGroup>
                          {plans.map((plan) => (
                            <CommandItem
                              key={plan.id}
                              value={`${plan.sku || plan.part_code} ${plan.description || plan.name} ${plan.mrp || ''}`}
                              onSelect={() => {
                                setPlanId(plan.id);
                                setPlanOpen(false);
                              }}
                              data-testid={`plan-option-${plan.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  planId === plan.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-mono text-sm">{plan.sku || plan.part_code}</span>
                                <span className="text-xs text-[#1D1D1F]">{plan.description || plan.name}</span>
                                {plan.mrp && <span className="text-xs text-[#0071E3] font-medium">₹{plan.mrp.toLocaleString('en-IN')}</span>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Activation Date */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  Device Activation Date
                </Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-[#F5F5F7] border-transparent hover:bg-[#E8E8ED] h-11",
                        !activationDate && "text-[#86868B]"
                      )}
                      data-testid="activation-date-btn"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activationDate ? (
                        format(activationDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={activationDate}
                      onSelect={(date) => {
                        setActivationDate(date);
                        setDateOpen(false);
                      }}
                      initialFocus
                      data-testid="activation-date-calendar"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4 border-t border-[#E8E8ED]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="px-6"
                data-testid="cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-8"
                data-testid="submit-request-btn"
              >
                {loading ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
