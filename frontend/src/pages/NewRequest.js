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
  Building2,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewRequest() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [formData, setFormData] = useState({
    dealer_name: "",
    dealer_mobile: "",
    customer_name: "",
    customer_mobile: "",
    customer_email: "",
    model_id: "",
    serial_number: "",
    plan_id: "",
    device_activation_date: null,
    billing_location: "",
    payment_type: "Insta",
  });

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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.plan_id) {
      toast.error("Please select an AppleCare+ plan");
      return;
    }
    
    if (!formData.device_activation_date) {
      toast.error("Please select the device activation date");
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        device_activation_date: format(formData.device_activation_date, "yyyy-MM-dd"),
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

  const selectedPlan = plans.find((p) => p.id === formData.plan_id);

  const InputField = ({ icon: Icon, label, id, ...props }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
        <Input
          id={id}
          className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
          {...props}
        />
      </div>
    </div>
  );

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
                <InputField
                  icon={Building2}
                  label="Dealer Name"
                  id="dealer_name"
                  value={formData.dealer_name}
                  onChange={(e) => handleChange("dealer_name", e.target.value)}
                  placeholder="Enter dealer name"
                  required
                  data-testid="dealer-name-input"
                />
                <InputField
                  icon={Phone}
                  label="Dealer Mobile"
                  id="dealer_mobile"
                  value={formData.dealer_mobile}
                  onChange={(e) => handleChange("dealer_mobile", e.target.value)}
                  placeholder="Enter mobile number"
                  required
                  data-testid="dealer-mobile-input"
                />
              </div>
            </div>

            {/* Customer Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider border-b border-[#E8E8ED] pb-2">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  icon={User}
                  label="Customer Name"
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleChange("customer_name", e.target.value)}
                  placeholder="Enter customer name"
                  required
                  data-testid="customer-name-input"
                />
                <InputField
                  icon={Phone}
                  label="Customer Mobile"
                  id="customer_mobile"
                  value={formData.customer_mobile}
                  onChange={(e) => handleChange("customer_mobile", e.target.value)}
                  placeholder="Enter mobile number"
                  required
                  data-testid="customer-mobile-input"
                />
              </div>
              <InputField
                icon={Mail}
                label="Customer Email"
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => handleChange("customer_email", e.target.value)}
                placeholder="Enter email address"
                required
                data-testid="customer-email-input"
              />
            </div>

            {/* Device Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider border-b border-[#E8E8ED] pb-2">
                Device Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  icon={Smartphone}
                  label="Model ID"
                  id="model_id"
                  value={formData.model_id}
                  onChange={(e) => handleChange("model_id", e.target.value)}
                  placeholder="e.g., iPhone 15 Pro Max"
                  required
                  data-testid="model-id-input"
                />
                <InputField
                  icon={Hash}
                  label="Serial Number / IMEI"
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleChange("serial_number", e.target.value)}
                  placeholder="Enter serial number"
                  required
                  data-testid="serial-number-input"
                />
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
                        <span className="flex items-center gap-2">
                          <span>{selectedPlan.name}</span>
                          <code className="text-xs bg-white px-1.5 py-0.5 rounded text-[#86868B]">
                            {selectedPlan.part_code}
                          </code>
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
                              value={`${plan.name} ${plan.part_code}`}
                              onSelect={() => {
                                handleChange("plan_id", plan.id);
                                setPlanOpen(false);
                              }}
                              data-testid={`plan-option-${plan.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.plan_id === plan.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{plan.name}</span>
                                <span className="text-xs text-[#86868B] font-mono">{plan.part_code}</span>
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
                        !formData.device_activation_date && "text-[#86868B]"
                      )}
                      data-testid="activation-date-btn"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.device_activation_date ? (
                        format(formData.device_activation_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.device_activation_date}
                      onSelect={(date) => {
                        handleChange("device_activation_date", date);
                        setDateOpen(false);
                      }}
                      initialFocus
                      data-testid="activation-date-calendar"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  icon={Building2}
                  label="Billing Location"
                  id="billing_location"
                  value={formData.billing_location}
                  onChange={(e) => handleChange("billing_location", e.target.value)}
                  placeholder="Enter billing location"
                  data-testid="billing-location-input"
                />
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
                    Payment Type
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                    <select
                      value={formData.payment_type}
                      onChange={(e) => handleChange("payment_type", e.target.value)}
                      className="w-full pl-10 pr-4 h-11 bg-[#F5F5F7] border-transparent rounded-lg focus:border-[#0071E3] focus:ring-0 text-[#1D1D1F]"
                      data-testid="payment-type-select"
                    >
                      <option value="Insta">Insta</option>
                      <option value="Credit GT">Credit GT</option>
                      <option value="MM2">MM2</option>
                    </select>
                  </div>
                </div>
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
