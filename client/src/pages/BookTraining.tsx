import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { catalog, type Product } from "@/data/catalog";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import CheckoutInlineAuth from "@/components/checkout/CheckoutInlineAuth";
import AddonUpsell from "@/components/booking/AddonUpsell";
import CardPaymentSection from "@/components/checkout/CardPaymentSection";
import { computeBookingPrice, BOOKING_DEPOSIT_RATE } from "@shared/config/bookingPricing";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Calendar, Clock, Users, ChevronRight, ChevronLeft,
  CheckCircle, Loader2, AlertCircle, Phone, Mail, Building2,
  ClipboardList, Shield,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;

interface ServiceArea {
  id: number;
  name: string;
  slug: string;
  availabilityRules: {
    daysOfWeek: number[];
    timeSlots: { startTime: string; endTime: string }[];
    maxParticipants: number;
    leadTimeDays: number;
    windowDays: number;
    blackoutDates?: string[];
  };
}

interface RawSlot {
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  bookedParticipants: number;
  available: boolean;
}

const EQUIPMENT_OPTIONS = [
  { value: "Counterbalance Forklift", key: "onsiteTraining.equipCounterbalance" },
  { value: "Reach Truck", key: "onsiteTraining.equipReachTruck" },
  { value: "Order Picker", key: "onsiteTraining.equipOrderPicker" },
  { value: "Scissor Lift", key: "onsiteTraining.equipScissorLift" },
  { value: "Boom/Aerial Lift", key: "onsiteTraining.equipBoomLift" },
  { value: "Other", key: "onsiteTraining.equipOther" },
] as const;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function getLocale(lang: string): string {
  return lang?.startsWith("es") ? "es-US" : "en-US";
}

function getDayNames(lang: string): string[] {
  const locale = getLocale(lang);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, i); // Jan 2024 starts on Monday; Sunday=0
    return d.toLocaleDateString(locale, { weekday: "short" });
  });
}

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(getLocale(lang), { weekday: "short", month: "short", day: "numeric" });
}

function formatMonthYear(year: number, month: number, lang: string): string {
  return new Date(year, month).toLocaleDateString(getLocale(lang), { month: "long", year: "numeric" });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function generateCalendarDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export default function BookTraining() {
  const { productSlug } = useParams<{ productSlug?: string }>();
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);

  const [zip, setZip] = useState("");
  const [checkingZip, setCheckingZip] = useState(false);
  const [serviceArea, setServiceArea] = useState<ServiceArea | null>(null);
  const [zipError, setZipError] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(() => {
    if (productSlug) {
      const match = catalog.find((p) => p.slug === productSlug && p.category === "hands-on");
      return match ? [match] : [];
    }
    const params = new URLSearchParams(window.location.search);
    const productsParam = params.get("products");
    if (productsParam) {
      const slugs = productsParam.split(",").map((s) => s.trim()).filter(Boolean);
      return catalog.filter((p) => slugs.includes(p.slug) && p.category === "hands-on");
    }
    return [];
  });

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);

  // Promo code — prefilled from ?code= share links (flyers/QR). Display math
  // here mirrors computeDiscountAmount in server/routes/discounts.ts; the
  // authoritative discounted charge is always recomputed server-side.
  const [discountInput, setDiscountInput] = useState(() => new URLSearchParams(window.location.search).get("code")?.toUpperCase() ?? "");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountType: "percent" | "fixed"; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountValidating, setDiscountValidating] = useState(false);

  const applyDiscountCode = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    setDiscountValidating(true);
    setDiscountError(null);
    try {
      const res = await apiRequest("POST", "/api/discount-codes/validate", { code });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount({ code: data.code, discountType: data.discountType, amount: Number(data.amount) });
      } else {
        setAppliedDiscount(null);
        setDiscountError(data.reason || null);
      }
    } catch {
      setAppliedDiscount(null);
      setDiscountError("invalid");
    } finally {
      setDiscountValidating(false);
    }
  }, []);

  // Auto-apply a code arriving via share link.
  useEffect(() => {
    if (discountInput) void applyDiscountCode(discountInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track funnel entry: user landed on the booking page.
  useEffect(() => {
    trackEvent("booking_started", { step_name: "zip_check" });
    trackEvent("booking_step_reached", { step: 1, step_name: "zip_check" });
  }, []);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerZip, setCustomerZip] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");
  const [depositInfo, setDepositInfo] = useState<{ deposit: number; depositSurcharge: number; depositCharged: number; balanceDue: number; volumeDiscount: number; total: number } | null>(null);

  // Note: with 100% upfront payment (BOOKING_DEPOSIT_RATE = 1.0), deposit =
  // total and balanceDue = 0. The variable names are kept for API compat.

  const handsOnProducts = useMemo(
    () => catalog.filter((p) => p.category === "hands-on"),
    []
  );

  const fromDate = useMemo(() => {
    const d = new Date(calYear, calMonth, 1);
    return d.toISOString().slice(0, 10);
  }, [calYear, calMonth]);

  const toDate = useMemo(() => {
    const d = new Date(calYear, calMonth + 1, 0);
    return d.toISOString().slice(0, 10);
  }, [calYear, calMonth]);

  const { data: rawSlots, isLoading: slotsLoading } = useQuery<RawSlot[]>({
    queryKey: ["/api/available-slots", serviceArea?.id, fromDate, toDate],
    enabled: !!serviceArea && step >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/available-slots?serviceAreaId=${serviceArea!.id}&from=${fromDate}&to=${toDate}`);
      if (!res.ok) throw new Error("Failed to fetch slots");
      return res.json();
    },
  });

  const availableDateSet = useMemo(() => {
    const set = new Set<string>();
    if (!rawSlots || !Array.isArray(rawSlots)) return set;
    for (const s of rawSlots) {
      if (s.available) set.add(s.date);
    }
    return set;
  }, [rawSlots]);

  const slotsForDate = useMemo(() => {
    if (!selectedDate || !rawSlots || !Array.isArray(rawSlots)) return [];
    return rawSlots
      .filter((s) => s.date === selectedDate && s.available)
      .map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        remaining: s.maxParticipants - s.bookedParticipants,
      }));
  }, [selectedDate, rawSlots]);

  const nextAvailableDate = useMemo(() => {
    if (!rawSlots || !Array.isArray(rawSlots)) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const sorted = rawSlots
      .filter((s) => s.available && s.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    return sorted.length > 0 ? sorted[0].date : null;
  }, [rawSlots]);

  const calWeeks = useMemo(() => generateCalendarDates(calYear, calMonth), [calYear, calMonth]);

  // Smart default: pre-fill the nearest available date when the calendar
  // step opens so the visitor starts one click from a time slot.
  useEffect(() => {
    if (step === 2 && !selectedDate && nextAvailableDate) {
      setSelectedDate(nextAvailableDate);
    }
  }, [step, selectedDate, nextAvailableDate]);

  async function checkZip() {
    if (!/^\d{5}$/.test(zip)) return;
    setCheckingZip(true);
    setZipError(false);
    try {
      const res = await fetch(`/api/service-areas/check?zip=${zip}`);
      const data = await res.json();
      if (data.available) {
        setServiceArea(data.serviceArea);
        setCustomerZip(zip);
        // Smart default: pre-select the area's most popular course (standard
        // forklift) so the visitor never starts from an empty selection.
        setSelectedProducts((prev) => {
          if (prev.length > 0) return prev;
          const defaultProduct = catalog.find(
            (p) => p.slug === `standard-forklift-certification-${data.serviceArea.slug}` && p.category === "hands-on"
          );
          return defaultProduct ? [defaultProduct] : prev;
        });
        trackEvent("booking_step_reached", { step: 2, step_name: "product_selection", zip_code: zip });
      } else {
        // Expansion intelligence: log unserved ZIPs to identify demand areas.
        console.log(`[UNSERVED-ZIP] ${zip}`);
        setZipError(true);
        setServiceArea(null);
      }
    } catch {
      setZipError(true);
    } finally {
      setCheckingZip(false);
    }
  }

  function toggleProduct(product: Product) {
    setSelectedProducts((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  }

  function toggleEquipment(val: string) {
    setSelectedEquipment((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  const canProceedStep1 = serviceArea && (selectedProducts.length > 0 || selectedEquipment.length > 0);
  const canProceedStep2 = selectedDate && selectedSlot;
  const canProceedStep3 =
    contactName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) &&
    contactPhone.trim().length >= 7 &&
    customerAddress.trim().length >= 3 &&
    customerCity.trim().length >= 2 &&
    customerState.length >= 2 &&
    customerZip.length >= 5 &&
    participantCount >= 1;

  function goNext() {
    if (step < 4) {
      setStep((s) => (s + 1) as Step);
      const nextStep = step + 1;
      const stepNames: Record<number, string> = { 1: "zip_check", 2: "date_slot", 3: "contact_details", 4: "review_payment" };
      trackEvent("booking_step_reached", {
        step: nextStep,
        step_name: stepNames[nextStep],
        ...(nextStep >= 3 ? { zip_code: customerZip } : {}),
        ...(nextStep >= 4 ? { participant_count: participantCount } : {}),
        ...(nextStep === 4 ? { total_price: totalEstimate } : {}),
      });
    }
  }
  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  interface BookingPayload {
    serviceAreaId: number;
    productSlug: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    participantCount: number;
    customerAddress: string;
    customerCity: string;
    customerState: string;
    customerZip: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    specialRequests?: string;
    productPrice: number;
    productSlugs: string[];
    paymentNonce?: string;
    discountCode?: string;
  }

  const bookingMutation = useMutation({
    mutationFn: (payload: BookingPayload) => apiRequest("POST", "/api/bookings", payload),
    onSuccess: async (res) => {
      const data = await res.json();
      setBookingNumber(data.bookingNumber || "");
      setDepositInfo(data.pricing || null);
      setSubmitted(true);
      trackEvent("booking_completed", {
        total_price: data.pricing?.total ?? totalEstimate,
        participant_count: participantCount,
        zip_code: customerZip,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err: Error) => {
      toast({
        title: t("bookTraining.bookingFailed"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Joined display value persisted in bookings.productSlug — includes the
  // base course AND any add-on upsells (e.g. "standard-forklift-... +
  // scissor-aerial-boom-lift-..."), so operations always see the full
  // selection on the booking record and in notification emails. The
  // authoritative charge is computed server-side from the productSlugs array.
  function buildProductSlug(): string {
    const parts: string[] = [];
    if (selectedProducts.length > 0) {
      parts.push(selectedProducts.map((p) => p.slug).join(" + "));
    }
    if (selectedEquipment.length > 0) {
      parts.push(`[Equipment: ${selectedEquipment.join(", ")}]`);
    }
    return parts.join(" | ") || "custom-training";
  }

  function handleSubmit(paymentNonce?: string | null) {
    if (!isAuthenticated || !serviceArea || !selectedDate || !selectedSlot) return;
    const productPrice = productsSubtotal;
    bookingMutation.mutate({
      paymentNonce: paymentNonce || undefined,
      discountCode: appliedDiscount?.code,
      productSlugs: selectedProducts.map((p) => p.slug),
      serviceAreaId: serviceArea.id,
      productSlug: buildProductSlug(),
      sessionDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      participantCount,
      customerAddress,
      customerCity,
      customerState,
      customerZip,
      contactName,
      contactPhone,
      contactEmail,
      specialRequests: specialRequests || undefined,
      productPrice,
    });
  }

  const prevMonth = useCallback(() => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }, [calMonth]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const canGoPrev = new Date(calYear, calMonth, 1) > today;

  const productsSubtotal = selectedProducts.reduce(
    (sum, p) => sum + (typeof p.price === "number" ? p.price : 0),
    0
  );
  const totalEstimate = productsSubtotal * participantCount;
  // Authoritative pricing (full payment, no volume discount) from the shared
  // module the server also charges from — null when only custom equipment is
  // selected. With BOOKING_DEPOSIT_RATE = 1.0, deposit = total, balance = 0.
  const bookingPricing = computeBookingPrice(selectedProducts.map((pr) => pr.slug), participantCount);
  // Promo discount preview — same clamping rules as the server (percent capped
  // at 100, fixed never below $0); full payment is charged on the discounted total.
  const discountAmount = bookingPricing && appliedDiscount
    ? appliedDiscount.discountType === "percent"
      ? Number((bookingPricing.total * (Math.min(Math.max(appliedDiscount.amount, 0), 100) / 100)).toFixed(2))
      : Math.min(appliedDiscount.amount, bookingPricing.total)
    : 0;
  const effectivePricing = bookingPricing && discountAmount > 0
    ? (() => {
        const total = Number((bookingPricing.total - discountAmount).toFixed(2));
        const deposit = Number((total * BOOKING_DEPOSIT_RATE).toFixed(2));
        return { ...bookingPricing, total, deposit, balance: Number((total - deposit).toFixed(2)) };
      })()
    : bookingPricing;
  // depositWithSurcharge is the amount charged now = full total + 3% card surcharge.
  const depositWithSurcharge = effectivePricing ? Number((effectivePricing.deposit * 1.03).toFixed(2)) : 0;
  const dayNames = useMemo(() => getDayNames(i18n.language || "en"), [i18n.language]);

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <SEOHead
          title={t("bookTraining.seoTitle", { brand: brand.name })}
          description={t("bookTraining.seoDescription", { brand: brand.name, body: industry.regulatory.body })}
        />
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="h-20 w-20 text-brand-green" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-booking-success">
            {t("bookTraining.successTitle")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("bookTraining.successMessage")}
          </p>
          {bookingNumber && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{t("bookTraining.bookingNumberLabel")}</p>
              <p className="text-xl font-bold font-mono text-foreground" data-testid="text-booking-number">{bookingNumber}</p>
            </div>
          )}
          {depositInfo && depositInfo.depositCharged > 0 && (
            <div className="bg-primary/10 border border-primary/40 rounded-lg p-4 text-left text-sm space-y-1" data-testid="deposit-receipt">
              <div className="flex justify-between font-semibold text-foreground">
                <span>{t("booking.paymentReceived")}</span>
                <span>${depositInfo.depositCharged.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("booking.paidInFull")}</span>
                <span>{t("booking.paidInFullBadge")}</span>
              </div>
            </div>
          )}
          <div className="bg-muted rounded-lg p-5 text-left space-y-2">
            <p className="font-semibold text-foreground">{t("bookTraining.whatsNextTitle")}</p>
            <ul className="text-muted-foreground text-sm space-y-1">
              <li>✓ {t("bookTraining.nextStep1")}</li>
              <li>✓ {t("bookTraining.nextStep2")}</li>
              <li>✓ {t("bookTraining.nextStep3")}</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" data-testid="link-back-home">
              <Link href="/">{t("cta.goHome")}</Link>
            </Button>
            <Button asChild data-testid="link-view-bookings">
              <Link href="/dashboard">{t("nav.dashboard")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={t("bookTraining.seoTitle", { brand: brand.name })}
        description={t("bookTraining.seoDescription", { brand: brand.name, body: industry.regulatory.body })}
        canonical="/book-training"
      />

      <div className="bg-brand-dark text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" data-testid="text-page-title">
            {t("bookTraining.pageTitle")}
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            {t("bookTraining.pageSubtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8" data-testid="booking-stepper">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    s < step
                      ? "bg-green-500 text-white"
                      : s === step
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${s === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {t(`bookTraining.step${s}Label`)}
                </span>
              </div>
              {s < 4 && (
                <div className={`flex-1 h-0.5 mx-2 ${s < step ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Goal gradient — visitors who see progress finish more often */}
        <p className="text-center text-sm font-medium text-brand-green -mt-4 mb-8" data-testid="text-booking-progress">
          {t("bookTraining.progressLabel", { percent: step * 25 })}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="space-y-6" data-testid="step-1-content">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-dark" />
                    {t("bookTraining.checkAvailability")}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">{t("bookTraining.enterZipDesc")}</p>
                  <div className="flex gap-2">
                    <Input
                      data-testid="input-booking-zip"
                      placeholder={t("bookTraining.zipPlaceholder")}
                      aria-label={t("bookTraining.zipPlaceholder")}
                      value={zip}
                      onChange={(e) => {
                        setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
                        setZipError(false);
                        if (serviceArea) { setServiceArea(null); }
                      }}
                      onKeyDown={(e) => e.key === "Enter" && checkZip()}
                      className="max-w-[180px]"
                    />
                    <Button
                      onClick={checkZip}
                      disabled={zip.length !== 5 || checkingZip}
                      data-testid="button-check-zip"
                    >
                      {checkingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : t("bookTraining.checkButton")}
                    </Button>
                  </div>
                  {serviceArea && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-sm text-green-700 dark:text-green-300" data-testid="text-area-found">
                        {t("bookTraining.areaAvailable", { area: serviceArea.name })}
                      </span>
                    </div>
                  )}
                  {zipError && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium text-sm mb-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {t("bookTraining.areaNotAvailable")}
                      </div>
                      <p className="text-sm text-amber-600 dark:text-amber-400 ml-7 mb-3">
                        {t("bookTraining.areaNotAvailableDesc")}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 ml-7">
                        <Link
                          href="/p/online-forklift-operator-training"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:brightness-95 transition-all"
                          data-testid="link-get-certified-online"
                        >
                          <Shield className="w-4 h-4" />
                          {t("bookTraining.getCertifiedOnline")}
                        </Link>
                        <Link
                          href="/request-quote"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-semibold text-sm hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all"
                          data-testid="link-request-custom-quote"
                        >
                          <ClipboardList className="w-4 h-4" />
                          {t("bookTraining.requestCustomQuote")}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {serviceArea && (
                  <div className="bg-card border rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-brand-dark" />
                      {t("bookTraining.selectTraining")}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">{t("bookTraining.selectTrainingDesc")}</p>

                    <div className="space-y-3">
                      {handsOnProducts.map((p) => {
                        const isSelected = selectedProducts.some((sp) => sp.id === p.id);
                        return (
                          <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProduct(p)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-primary/30"
                          }`}
                          data-testid={`product-card-${p.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground">{p.title}</p>
                                {p.featured && <Badge variant="secondary" className="text-xs">{t("common.mostPopular")}</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.shortDescription}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> {p.duration}
                                </span>
                                {p.location !== "online" && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" /> {p.location.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-foreground">
                                {typeof p.price === "number" ? `$${p.price}` : t("cta.contactUs")}
                              </p>
                              <p className="text-xs text-muted-foreground">{t("bookTraining.perPerson")}</p>
                            </div>
                          </div>
                        </button>
                        );
                      })}
                    </div>

                    <AddonUpsell selectedProducts={selectedProducts} onToggle={toggleProduct} />

                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-medium text-foreground mb-3">{t("bookTraining.orSelectEquipment")}</h3>
                      <div className="grid grid-cols-2 gap-2" data-testid="equipment-checkboxes">
                        {EQUIPMENT_OPTIONS.map((eq) => (
                          <label
                            key={eq.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedEquipment.includes(eq.value)}
                              onCheckedChange={() => toggleEquipment(eq.value)}
                              data-testid={`checkbox-equip-${eq.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                            />
                            <span className="text-sm">{t(eq.key)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6" data-testid="step-2-content">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-dark" />
                    {t("bookTraining.chooseDateTime")}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">{t("bookTraining.chooseDateTimeDesc")}</p>

                  {nextAvailableDate && !slotsLoading && (
                    <p className="text-sm text-green-700 dark:text-green-400 mb-4 flex items-center gap-1.5" data-testid="text-next-available">
                      <Calendar className="w-4 h-4" />
                      {t("bookTraining.nextAvailable", { date: formatDate(nextAvailableDate, i18n.language || "en") })}
                    </p>
                  )}

                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-dark" />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={prevMonth}
                          disabled={!canGoPrev}
                          data-testid="button-prev-month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h3 className="font-semibold" data-testid="text-calendar-month">
                          {formatMonthYear(calYear, calMonth, i18n.language || "en")}
                        </h3>
                        <Button variant="ghost" size="sm" onClick={nextMonth} data-testid="button-next-month">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {dayNames.map((d) => (
                          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                        ))}
                      </div>

                      {calWeeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-1">
                          {week.map((day, di) => {
                            if (day === null) return <div key={di} />;
                            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const isAvailable = availableDateSet.has(dateStr);
                            const isPast = new Date(dateStr + "T23:59:59") < today;
                            const isSelected = selectedDate === dateStr;
                            return (
                              <button
                                key={di}
                                type="button"
                                disabled={!isAvailable || isPast}
                                onClick={() => {
                                  setSelectedDate(dateStr);
                                  setSelectedSlot(null);
                                }}
                                className={`p-2 text-sm rounded-lg text-center transition-colors ${
                                  isSelected
                                    ? "bg-accent text-accent-foreground font-bold"
                                    : isAvailable && !isPast
                                      ? "bg-green-50 dark:bg-green-900/20 text-foreground hover:bg-green-100 dark:hover:bg-green-900/40 font-medium"
                                      : "text-muted-foreground/40 cursor-not-allowed"
                                }`}
                                data-testid={`calendar-day-${dateStr}`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      ))}

                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800" />
                          {t("bookTraining.available")}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-muted" />
                          {t("bookTraining.unavailable")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedDate && slotsForDate.length > 0 && (
                  <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-brand-dark" />
                      {t("bookTraining.selectTimeSlot")} — {formatDate(selectedDate, i18n.language || "en")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {slotsForDate.map((slot) => {
                        const isActive =
                          selectedSlot?.startTime === slot.startTime &&
                          selectedSlot?.endTime === slot.endTime;
                        return (
                          <button
                            key={`${slot.startTime}-${slot.endTime}`}
                            type="button"
                            onClick={() => setSelectedSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                            className={`p-4 rounded-lg border-2 text-left transition-colors ${
                              isActive
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-primary/30"
                            }`}
                            data-testid={`slot-${slot.startTime}`}
                          >
                            <p className="font-semibold">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("bookTraining.spotsRemaining", { count: slot.remaining })}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedDate && slotsForDate.length === 0 && !slotsLoading && (
                  <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
                    <p>{t("bookTraining.noSlotsForDate")}</p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="bg-card border rounded-xl p-6 space-y-5" data-testid="step-3-content">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-dark" />
                  {t("bookTraining.yourDetails")}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="book-contact-name">{t("bookTraining.contactNameLabel")} *</Label>
                    <Input
                      id="book-contact-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Jane Smith"
                      data-testid="input-booking-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="book-company">{t("bookTraining.companyLabel")}</Label>
                    <Input
                      id="book-company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t("common.optional")}
                      data-testid="input-booking-company"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="book-email">{t("form.emailAddress")} *</Label>
                    <Input
                      id="book-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="jane@company.com"
                      data-testid="input-booking-email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="book-phone">{t("form.phone")} *</Label>
                    <Input
                      id="book-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="(555) 555-5555"
                      data-testid="input-booking-phone"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">{t("bookTraining.trainingLocation")} *</p>
                  <div className="space-y-3">
                    <Input
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder={t("onsiteTraining.streetAddress")}
                      aria-label={t("onsiteTraining.streetAddress")}
                      data-testid="input-booking-address"
                    />
                    <div className="grid grid-cols-6 gap-3">
                      <Input
                        className="col-span-3"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        placeholder={t("onsiteTraining.city")}
                        aria-label={t("onsiteTraining.city")}
                        data-testid="input-booking-city"
                      />
                      <select
                        className="col-span-1 h-10 rounded-md border border-input bg-background px-2 text-sm"
                        value={customerState}
                        onChange={(e) => setCustomerState(e.target.value)}
                        aria-label={t("onsiteTraining.state")}
                        data-testid="select-booking-state"
                      >
                        <option value="">{t("onsiteTraining.state")}</option>
                        {US_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <Input
                        className="col-span-2"
                        value={customerZip}
                        onChange={(e) => setCustomerZip(e.target.value)}
                        placeholder={t("onsiteTraining.zip")}
                        aria-label={t("onsiteTraining.zip")}
                        maxLength={10}
                        data-testid="input-booking-zip-address"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="book-participants">{t("bookTraining.participantCount")} *</Label>
                    <Input
                      id="book-participants"
                      type="number"
                      min={1}
                      max={serviceArea?.availabilityRules?.maxParticipants ?? 10}
                      value={participantCount}
                      onChange={(e) => setParticipantCount(Math.min(serviceArea?.availabilityRules?.maxParticipants ?? 10, Math.max(1, parseInt(e.target.value) || 1)))}
                      data-testid="input-booking-participants"
                    />
                  </div>
                </div>

                {(participantCount >= 10 || participantCount >= (serviceArea?.availabilityRules?.maxParticipants ?? 10)) && (
                  <div className="rounded-md bg-primary/10 border border-primary/40 p-4 space-y-1" data-testid="banner-large-group">
                    <p className="text-sm font-semibold">{t("booking.largeGroupTitle")}</p>
                    <p className="text-sm text-muted-foreground">{t("booking.largeGroupDesc")}</p>
                    <Link href="/request-quote" className="text-sm font-medium text-accent hover:underline inline-block" data-testid="link-booking-large-group-quote">
                      {t("booking.largeGroupCta")}
                    </Link>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="book-notes">{t("bookTraining.specialRequests")}</Label>
                  <Textarea
                    id="book-notes"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder={t("bookTraining.specialRequestsPlaceholder", { body: industry.regulatory.body })}
                    rows={3}
                    data-testid="textarea-booking-notes"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6" data-testid="step-4-content">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-dark" />
                    {t("bookTraining.reviewTitle")}
                  </h2>

                  <div className="divide-y space-y-4">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-muted-foreground">{t("bookTraining.trainingLabel")}</span>
                      <span className="font-medium text-foreground">
                        {selectedProducts.length > 0
                          ? selectedProducts.map((p) => p.title).join(", ")
                          : selectedEquipment.join(", ")}
                        {selectedProducts.length > 0 && selectedEquipment.length > 0 && (
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            + {selectedEquipment.join(", ")}
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">{t("bookTraining.dateLabel")}</span>
                      <span className="font-medium text-foreground">{selectedDate && formatDate(selectedDate, i18n.language || "en")}</span>
                      <span className="text-muted-foreground">{t("bookTraining.timeLabel")}</span>
                      <span className="font-medium text-foreground">
                        {selectedSlot && `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}`}
                      </span>
                      <span className="text-muted-foreground">{t("bookTraining.serviceAreaLabel")}</span>
                      <span className="font-medium text-foreground">{serviceArea?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-sm pt-4">
                      <span className="text-muted-foreground">{t("bookTraining.contactLabel")}</span>
                      <span className="font-medium text-foreground">{contactName}</span>
                      <span className="text-muted-foreground">{t("form.email")}</span>
                      <span className="font-medium text-foreground">{contactEmail}</span>
                      <span className="text-muted-foreground">{t("form.phone")}</span>
                      <span className="font-medium text-foreground">{contactPhone}</span>
                      <span className="text-muted-foreground">{t("bookTraining.locationLabel")}</span>
                      <span className="font-medium text-foreground">
                        {customerAddress}, {customerCity}, {customerState} {customerZip}
                      </span>
                      <span className="text-muted-foreground">{t("bookTraining.participantsLabel")}</span>
                      <span className="font-medium text-foreground">{participantCount}</span>
                    </div>

                    {specialRequests && (
                      <div className="text-sm pt-4">
                        <span className="text-muted-foreground">{t("bookTraining.specialRequests")}</span>
                        <p className="font-medium text-foreground mt-1">{specialRequests}</p>
                      </div>
                    )}
                  </div>
                </div>

                {!isAuthenticated && (
                  <CheckoutInlineAuth />
                )}

                {isAuthenticated && bookingPricing && (
                  <div className="space-y-3">
                    <div className="bg-primary/10 border border-primary/40 rounded-xl p-4 text-sm space-y-1.5" data-testid="deposit-summary">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("booking.trainingTotal")}</span>
                        <span className="font-medium">${bookingPricing.total.toFixed(2)}</span>
                      </div>
                      {appliedDiscount && discountAmount > 0 && (
                        <div className="flex justify-between text-brand-green" data-testid="row-promo-discount">
                          <span>{t("bookTraining.promoDiscount", { code: appliedDiscount.code })}</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-foreground">
                        <span>{t("booking.payNow")}</span>
                        <span>${depositWithSurcharge.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">{t("booking.fullPaymentNote")}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex gap-2" data-testid="row-promo-input">
                        <Input
                          value={discountInput}
                          onChange={(e) => {
                            setDiscountInput(e.target.value.toUpperCase());
                            setDiscountError(null);
                          }}
                          placeholder={t("bookTraining.promoPlaceholder")}
                          className="h-9"
                          data-testid="input-promo-code"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 shrink-0"
                          disabled={discountValidating || !discountInput.trim()}
                          onClick={() => applyDiscountCode(discountInput)}
                          data-testid="button-apply-promo"
                        >
                          {appliedDiscount && discountAmount > 0 ? t("bookTraining.promoApplied") : t("bookTraining.promoApply")}
                        </Button>
                      </div>
                      {discountError && (
                        <p className="text-xs text-destructive" data-testid="text-promo-error">{t("bookTraining.promoInvalid")}</p>
                      )}
                    </div>
                    <CardPaymentSection
                      chargeAmount={depositWithSurcharge}
                      pending={bookingMutation.isPending}
                      onPay={(nonce) => handleSubmit(nonce)}
                      ctaLabel={t("booking.payNowCta", { amount: depositWithSurcharge.toFixed(2) })}
                      fallbackCtaLabel={t("bookTraining.confirmBooking")}
                    />
                  </div>
                )}

                {isAuthenticated && !bookingPricing && (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleSubmit(null)}
                      disabled={bookingMutation.isPending}
                      className="w-full bg-accent text-accent-foreground border-accent-border h-12 text-base"
                      data-testid="button-submit-booking"
                    >
                      {bookingMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {t("bookTraining.submitting")}
                        </>
                      ) : (
                        t("bookTraining.confirmBooking")
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {t("bookTraining.noPaymentNote")}
                    </p>
                  </div>
                )}

                {bookingMutation.isError && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-3" data-testid="text-booking-error">
                    {t("bookTraining.bookingFailed")}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <Button variant="outline" onClick={goBack} data-testid="button-step-back">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t("common.back")}
                </Button>
              ) : (
                <div />
              )}
              {step < 4 && (
                <Button
                  onClick={goNext}
                  disabled={
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2) ||
                    (step === 3 && !canProceedStep3)
                  }
                  data-testid="button-step-next"
                >
                  {t("common.next")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6 sticky top-4">
              <h3 className="font-semibold text-lg mb-4">{t("bookTraining.bookingSummary")}</h3>
              <div className="space-y-3 text-sm">
                {selectedProducts.length > 0 && (
                  <div>
                    <p className="text-muted-foreground">{t("bookTraining.trainingLabel")}</p>
                    {selectedProducts.map((p) => (
                      <div key={p.id} className="flex justify-between items-baseline mt-1">
                        <p className="font-medium text-foreground">{p.title}</p>
                        {typeof p.price === "number" && (
                          <span className="text-xs text-muted-foreground">${p.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {selectedEquipment.length > 0 && (
                  <div>
                    <p className="text-muted-foreground">{t("bookTraining.equipmentLabel")}</p>
                    <p className="font-medium text-foreground">{selectedEquipment.join(", ")}</p>
                  </div>
                )}
                {serviceArea && (
                  <div>
                    <p className="text-muted-foreground">{t("bookTraining.serviceAreaLabel")}</p>
                    <p className="font-medium text-foreground">{serviceArea.name}</p>
                  </div>
                )}
                {selectedDate && (
                  <div>
                    <p className="text-muted-foreground">{t("bookTraining.dateLabel")}</p>
                    <p className="font-medium text-foreground">{formatDate(selectedDate, i18n.language || "en")}</p>
                  </div>
                )}
                {selectedSlot && (
                  <div>
                    <p className="text-muted-foreground">{t("bookTraining.timeLabel")}</p>
                    <p className="font-medium text-foreground">
                      {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                    </p>
                  </div>
                )}
                {participantCount > 0 && step >= 3 && (
                  <div>
                    <p className="text-muted-foreground">{t("bookTraining.participantsLabel")}</p>
                    <p className="font-medium text-foreground">{participantCount}</p>
                  </div>
                )}

                {productsSubtotal > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("bookTraining.pricePerPerson")}</span>
                      <span className="font-medium">${productsSubtotal}</span>
                    </div>
                    {step >= 3 && participantCount > 1 && (
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">× {participantCount}</span>
                        <span className="font-bold text-lg text-foreground">${totalEstimate.toFixed(2)}</span>
                      </div>
                    )}
                    {bookingPricing && (
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-muted-foreground">{t("booking.payNow")}</span>
                        <span className="font-semibold">${depositWithSurcharge.toFixed(2)}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{t("booking.priceAnchor")}</p>
                    {selectedEquipment.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {t("bookTraining.equipmentPricingNote")}
                      </p>
                    )}
                  </div>
                )}

                {selectedProducts.length === 0 && selectedEquipment.length === 0 && !serviceArea && (
                  <p className="text-muted-foreground italic">{t("bookTraining.noSelections")}</p>
                )}

                {(selectedDate || selectedSlot) && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {t("bookTraining.subjectToConfirmation")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-brand-dark text-white rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3">{t("bookTraining.whyBookWithUs")}</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex gap-2">
                  <Building2 className="h-5 w-5 shrink-0 text-accent" />
                  <span>{t("bookTraining.benefit1")}</span>
                </li>
                <li className="flex gap-2">
                  <Users className="h-5 w-5 shrink-0 text-accent" />
                  <span>{t("bookTraining.benefit2")}</span>
                </li>
                <li className="flex gap-2">
                  <Shield className="h-5 w-5 shrink-0 text-accent" />
                  <span>{t("bookTraining.benefit3", { body: industry.regulatory.body })}</span>
                </li>
                <li className="flex gap-2">
                  <Calendar className="h-5 w-5 shrink-0 text-accent" />
                  <span>{t("bookTraining.benefit4")}</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-foreground">{t("bookTraining.needHelp")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-brand-dark" />
                  <a href={`tel:${brand.support.phoneTel}`} className="hover:text-brand-dark" data-testid="link-support-phone">
                    {brand.support.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-brand-dark" />
                  <a href={`mailto:${brand.support.infoEmail}`} className="hover:text-brand-dark" data-testid="link-support-email">
                    {brand.support.infoEmail}
                  </a>
                </div>
              </div>
              <Link
                href="/request-onsite-training"
                className="text-sm text-accent hover:underline block mt-2"
                data-testid="link-request-onsite"
              >
                {t("bookTraining.preferSimpleRequest")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
