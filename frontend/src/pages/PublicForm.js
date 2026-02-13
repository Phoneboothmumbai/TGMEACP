import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// InputField component defined OUTSIDE to prevent re-creation on each render
const InputField = memo(({ icon: Icon, label, id, value, onChange, ...props }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-xs font-medium text-[#86868B] uppercase tracking-wider">
      {label}
    </Label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
      <Input
        id={id}
        value={value}
        onChange={onChange}
        className="pl-10 bg-[#F5F5F7] border-transparent focus:border-[#0071E3] focus:ring-0 rounded-lg h-11"
        {...props}
      />
    </div>
  </div>
));

export default function PublicForm() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

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
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/plans?public=true`);
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
      const response = await axios.post(`${API_URL}/api/activation-requests`, submitData);
      setSubmittedData(response.data);
      setSubmitted(true);
      toast.success("Activation request submitted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === formData.plan_id);

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white border border-[#D2D2D7]/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans'] mb-2">
            Request Submitted Successfully!
          </h1>
          <p className="text-[#86868B] mb-6">
            Your AppleCare+ activation request has been received. We will process it shortly.
          </p>
          <div className="bg-[#F5F5F7] rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-[#86868B] mb-1">Reference ID</p>
            <p className="font-mono text-[#1D1D1F]">{submittedData?.id}</p>
          </div>
          <div className="bg-[#F5F5F7] rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-[#86868B] mb-1">Customer</p>
            <p className="text-[#1D1D1F]">{submittedData?.customer_name}</p>
            <p className="text-sm text-[#86868B]">{submittedData?.customer_email}</p>
          </div>
          <Button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                dealer_name: "",
                dealer_mobile: "",
                customer_name: "",
                customer_mobile: "",
                customer_email: "",
                model_id: "",
                serial_number: "",
                plan_id: "",
                device_activation_date: null,
              });
            }}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-8"
            data-testid="submit-another-btn"
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#0071E3] flex items-center justify-center">
              <span className="text-white font-bold text-lg">AC+</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-semibold text-[#1D1D1F] font-['Plus_Jakarta_Sans']">
                AppleCare+
              </h1>
              <p className="text-xs text-[#86868B]">Activation Request</p>
            </div>
          </div>
          <p className="text-[#86868B] max-w-md mx-auto">
            Fill in the details below to submit your AppleCare+ activation request
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-[#D2D2D7]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl p-8" data-testid="public-form-card">
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
                  data-testid="public-dealer-name-input"
                />
                <InputField
                  icon={Phone}
                  label="Dealer Mobile Number"
                  id="dealer_mobile"
                  value={formData.dealer_mobile}
                  onChange={(e) => handleChange("dealer_mobile", e.target.value)}
                  placeholder="Enter mobile number"
                  required
                  data-testid="public-dealer-mobile-input"
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
                  data-testid="public-customer-name-input"
                />
                <InputField
                  icon={Phone}
                  label="Customer Number"
                  id="customer_mobile"
                  value={formData.customer_mobile}
                  onChange={(e) => handleChange("customer_mobile", e.target.value)}
                  placeholder="Enter customer number"
                  required
                  data-testid="public-customer-mobile-input"
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
                data-testid="public-customer-email-input"
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
                  data-testid="public-model-id-input"
                />
                <InputField
                  icon={Hash}
                  label="Serial Number / IMEI"
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleChange("serial_number", e.target.value)}
                  placeholder="Enter serial number"
                  required
                  data-testid="public-serial-number-input"
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
                      data-testid="public-plan-select-btn"
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
                      <CommandInput placeholder="Search plans..." data-testid="public-plan-search-input" />
                      <CommandList>
                        <CommandEmpty>No plan found.</CommandEmpty>
                        <CommandGroup>
                          {plans.map((plan) => (
                            <CommandItem
                              key={plan.id}
                              value={`${plan.sku || plan.part_code} ${plan.description || plan.name} ${plan.mrp || ''}`}
                              onSelect={() => {
                                handleChange("plan_id", plan.id);
                                setPlanOpen(false);
                              }}
                              data-testid={`public-plan-option-${plan.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.plan_id === plan.id ? "opacity-100" : "opacity-0"
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
                        !formData.device_activation_date && "text-[#86868B]"
                      )}
                      data-testid="public-activation-date-btn"
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
                      data-testid="public-activation-date-calendar"
                    />
                  </PopoverContent>
                </Popover>
              </div>

            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-[#E8E8ED]">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full h-12 text-base"
                data-testid="public-submit-request-btn"
              >
                {loading ? "Submitting..." : "Submit Activation Request"}
              </Button>
            </div>
          </form>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-6">
          <a
            href="/login"
            className="text-sm text-[#86868B] hover:text-[#0071E3] transition-colors"
          >
            Admin Login →
          </a>
        </div>
      </div>
    </div>
  );
}
