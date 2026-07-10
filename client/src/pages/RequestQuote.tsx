import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { getActiveLocations, getLocation, type TrainingLocation } from "@shared/config/locations";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { trackLeadSubmit, trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building2, Users, MapPin, Phone, Mail, Calendar, CalendarDays, ClipboardList, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { formatUsPhone, normalizeEmail, capitalizeWords, digitsOnly } from "@/lib/inputFormat";

const EQUIPMENT_KEYS = [
  "counterbalanceForklift",
  "reachTruck",
  "orderPicker",
  "electricPalletJack",
  "scissorLift",
  "aerialBoomLift",
] as const;

const TRAINING_TYPES = [
  { value: "Initial Certification", labelKey: "requestQuote.typeInitialCert" },
  { value: "Recertification", labelKey: "requestQuote.typeRecert" },
  { value: "Refresher", labelKey: "requestQuote.typeRefresher" },
  { value: "Evaluation Only", labelKey: "requestQuote.typeEvalOnly" },
] as const;

const activeLocations = getActiveLocations();

const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  companyName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  requestedLocationSlug: z.string().min(1, "Please select a location"),
  trainingLocation: z.enum(["facility", "onsite"]),
  trainingAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  traineeCount: z.coerce.number().int().min(1, "At least 1 participant").max(1000),
  equipmentTypes: z.array(z.string()).min(1, "Please select at least one equipment type"),
  trainingType: z.string().optional(),
  preferredDate1: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.trainingLocation === "onsite") {
    return data.trainingAddress && data.trainingAddress.length >= 5 &&
           data.city && data.city.length >= 2 &&
           data.state && data.state.length >= 2 &&
           data.zip && data.zip.length >= 5;
  }
  return true;
}, {
  message: "Please provide the full training address for on-site training",
  path: ["trainingAddress"],
});

type FormValues = z.infer<typeof formSchema>;

function getLeadSourceFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") || "direct";
}

function getSelectedLocation(slug: string): TrainingLocation | undefined {
  return getLocation(slug);
}

export default function RequestQuote() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  // Track funnel entry: user landed on the quote form.
  useEffect(() => {
    trackEvent("quote_started", {});
  }, []);

  const defaultLocationSlug = activeLocations.length > 0 ? activeLocations[0].slug : "san-diego";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      email: "",
      phone: "",
      requestedLocationSlug: defaultLocationSlug,
      trainingLocation: "facility",
      trainingAddress: "",
      city: "",
      state: "",
      zip: "",
      traineeCount: 1,
      equipmentTypes: [],
      trainingType: "Initial Certification",
      preferredDate1: "",
      notes: "",
    },
  });

  const trainingLocation = form.watch("trainingLocation");
  const selectedLocationSlug = form.watch("requestedLocationSlug");
  const selectedLocation = getSelectedLocation(selectedLocationSlug);
  const showFacilityOption = selectedLocation?.supportsInPerson ?? false;

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const loc = getSelectedLocation(data.requestedLocationSlug);
      const isFacility = data.trainingLocation === "facility" && loc?.supportsInPerson;
      const payload: Record<string, string | number | string[] | undefined> = {
        contactName: `${data.firstName} ${data.lastName}`,
        companyName: data.companyName || undefined,
        email: data.email,
        phone: data.phone || undefined,
        trainingAddress: isFacility ? (loc?.address.street || "") : data.trainingAddress,
        city: isFacility ? (loc?.address.city || "") : data.city,
        state: isFacility ? (loc?.address.state || "") : data.state,
        zip: isFacility ? (loc?.address.zip || "") : data.zip,
        traineeCount: data.traineeCount,
        equipmentTypes: data.equipmentTypes,
        trainingType: data.trainingType || undefined,
        preferredDate1: data.preferredDate1 || undefined,
        notes: data.notes || undefined,
        leadSource: getLeadSourceFromUrl(),
        requestedLocationSlug: data.requestedLocationSlug,
        requestedLocationType: isFacility ? "facility" : "customer_onsite",
      };
      return apiRequest("POST", "/api/onsite-requests", payload);
    },
    onSuccess: () => {
      trackLeadSubmit(getLeadSourceFromUrl(), form.getValues("requestedLocationSlug"));
      trackEvent("quote_submitted", {
        lead_source: getLeadSourceFromUrl(),
        trainee_count: form.getValues("traineeCount"),
        training_location: form.getValues("trainingLocation"),
        requested_location: form.getValues("requestedLocationSlug"),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <SEOHead
          title={t("requestQuote.seoTitle", { brand: brand.name })}
          description={t("requestQuote.seoDesc", { brand: brand.name })}
        />
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="h-20 w-20 text-brand-green" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-success-title">{t("requestQuote.successTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("requestQuote.successMessage")}</p>
          <div className="bg-muted rounded-lg p-5 text-left space-y-2">
            <p className="font-semibold text-foreground">{t("requestQuote.whatsNext")}</p>
            <ul className="text-muted-foreground text-sm space-y-1">
              <li data-testid="text-step-1">&#10003; {t("requestQuote.step1")}</li>
              <li data-testid="text-step-2">&#10003; {t("requestQuote.step2")}</li>
              <li data-testid="text-step-3">&#10003; {t("requestQuote.step3")}</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("requestQuote.questionsCall")}{" "}
            <a href={`tel:${brand.support.phoneTel}`} className="text-brand-dark font-medium" data-testid="link-phone-confirmation">
              {brand.support.phone}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={t("requestQuote.seoTitle", { brand: brand.name })}
        description={t("requestQuote.seoDesc", { brand: brand.name })}
        canonical="/request-quote"
      />

      <div className="bg-gradient-to-br from-brand-dark to-[hsl(10,22%,15%)] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-page-title">{t("requestQuote.pageTitle")}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">{t("requestQuote.pageSubtitle")}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="bg-accent/10 border-2 border-accent rounded-xl p-5 mb-6" data-testid="self-serve-callout">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-brand-orange" />
              {t("requestQuote.selfServeTitle")}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{t("requestQuote.selfServeDesc")}</p>
            <Link href="/book-training">
              <Button className="bg-accent text-accent-foreground border-accent-border" data-testid="button-self-serve-book">
                {t("requestQuote.selfServeCta")}
              </Button>
            </Link>
          </div>

          <div className="bg-primary/10 border border-primary/40 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-brand-orange" />
              {t("requestQuote.startingPricesTitle", { defaultValue: "Starting Prices" })}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-brand-green mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{t("requestQuote.priceOnsiteLabel", { defaultValue: "Onsite / Company Training" })}</span>
                  <span className="block text-muted-foreground">{t("requestQuote.priceOnsiteValue", { defaultValue: "From $280 per person depending on group size and equipment" })}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-brand-green mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">{t("requestQuote.priceHandsOnLabel", { defaultValue: "Hands-On at Our Location" })}</span>
                  <span className="block text-muted-foreground">{t("requestQuote.priceHandsOnValue", { defaultValue: "From $200-300 per person depending on equipment" })}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {t("requestQuote.priceNote", { defaultValue: "Volume discounts available for 5+ trainees. Train-the-Trainer available for $750. Final pricing confirmed in your quote." })}
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-foreground">{t("requestQuote.formTitle")}</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("requestQuote.firstName")}</FormLabel>
                      <FormControl><Input placeholder="Jane" {...field} type="text" autoComplete="given-name" onBlur={() => field.onChange(capitalizeWords(field.value.trim()))} data-testid="input-first-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("requestQuote.lastName")}</FormLabel>
                      <FormControl><Input placeholder="Smith" {...field} type="text" autoComplete="family-name" onBlur={() => field.onChange(capitalizeWords(field.value.trim()))} data-testid="input-last-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("requestQuote.companyNameOptional")}</FormLabel>
                    <FormControl><Input placeholder="Acme Logistics" {...field} type="text" autoComplete="organization" data-testid="input-company-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("requestQuote.email")}</FormLabel>
                      <FormControl><Input type="email" inputMode="email" autoComplete="email" placeholder="jane@company.com" {...field} onChange={(e) => field.onChange(normalizeEmail(e.target.value))} data-testid="input-email" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("requestQuote.phoneOptional")}</FormLabel>
                      <FormControl><Input type="tel" inputMode="tel" autoComplete="tel" maxLength={14} placeholder="(555) 555-5555" {...field} onChange={(e) => field.onChange(formatUsPhone(e.target.value))} data-testid="input-phone" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="requestedLocationSlug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("requestQuote.trainingMarket")}</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        const loc = getSelectedLocation(val);
                        if (loc && !loc.supportsInPerson) {
                          form.setValue("trainingLocation", "onsite");
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-training-market">
                          <SelectValue placeholder={t("requestQuote.selectLocation")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeLocations.map((loc) => (
                          <SelectItem key={loc.slug} value={loc.slug}>{loc.displayName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="trainingLocation" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t("requestQuote.trainingLocationLabel")}</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col sm:flex-row gap-4">
                        {showFacilityOption && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="facility" id="loc-facility" data-testid="radio-facility" />
                            <label htmlFor="loc-facility" className="text-sm cursor-pointer">
                              {t("requestQuote.atFacility", { location: selectedLocation?.displayName || "" })}
                            </label>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="onsite" id="loc-onsite" data-testid="radio-onsite" />
                          <label htmlFor="loc-onsite" className="text-sm cursor-pointer">{t("requestQuote.atYourFacility")}</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {trainingLocation === "onsite" && (
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <p className="text-sm font-medium">{t("requestQuote.yourTrainingAddress")}</p>
                    <FormField control={form.control} name="trainingAddress" render={({ field }) => (
                      <FormItem>
                        <FormControl><Input type="text" autoComplete="street-address" placeholder={t("requestQuote.streetPlaceholder")} {...field} data-testid="input-training-address" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-6 gap-3">
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormControl><Input type="text" autoComplete="address-level2" placeholder={t("requestQuote.cityPlaceholder")} {...field} onBlur={() => field.onChange(capitalizeWords((field.value ?? "").trim()))} data-testid="input-city" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormControl><Input type="text" autoComplete="address-level1" placeholder="CA" maxLength={2} {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} data-testid="input-state" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="zip" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormControl><Input type="text" inputMode="numeric" autoComplete="postal-code" placeholder="92121" maxLength={5} {...field} onChange={(e) => field.onChange(digitsOnly(e.target.value).slice(0, 5))} data-testid="input-zip" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField control={form.control} name="traineeCount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("requestQuote.participantCount")}</FormLabel>
                      <FormControl><Input type="number" inputMode="numeric" min={1} placeholder={t("requestQuote.participantPlaceholder")} {...field} data-testid="input-trainee-count" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="trainingType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("requestQuote.trainingType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-training-type">
                            <SelectValue placeholder={t("requestQuote.selectTrainingType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRAINING_TYPES.map((tt) => (
                            <SelectItem key={tt.value} value={tt.value}>{t(tt.labelKey)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="equipmentTypes" render={() => (
                  <FormItem>
                    <FormLabel>{t("requestQuote.equipmentTypes")}</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-1" data-testid="equipment-types-group">
                      {EQUIPMENT_KEYS.map((key) => (
                        <FormField key={key} control={form.control} name="equipmentTypes" render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(key)}
                                onCheckedChange={(checked) => {
                                  const current = field.value ?? [];
                                  field.onChange(checked ? [...current, key] : current.filter((v) => v !== key));
                                }}
                                data-testid={`checkbox-equipment-${key}`}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">{t(`requestQuote.eq.${key}`)}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="preferredDate1" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("requestQuote.preferredDateOptional")}</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-preferred-date-1" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("requestQuote.additionalNotes")}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("requestQuote.notesPlaceholder")} rows={4} {...field} data-testid="textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {mutation.isError && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-3" data-testid="text-error-message">
                    {t("requestQuote.errorMessage", { phone: brand.support.phone })}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground border-accent-border" disabled={mutation.isPending} data-testid="button-submit-request">
                  {mutation.isPending ? t("requestQuote.submitting") : t("requestQuote.submitRequest")}
                </Button>

                <p className="text-xs text-muted-foreground text-center">{t("requestQuote.noPaymentNote")}</p>
              </form>
            </Form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-dark text-white rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4">{t("requestQuote.whyMiramar")}</h3>
            <ul className="space-y-3 text-white/80 text-sm">
              <li className="flex gap-2">
                <Building2 className="h-5 w-5 shrink-0 text-accent" />
                <span>{t("requestQuote.benefit1")}</span>
              </li>
              <li className="flex gap-2">
                <Users className="h-5 w-5 shrink-0 text-accent" />
                <span>{t("requestQuote.benefit2")}</span>
              </li>
              <li className="flex gap-2">
                <ClipboardList className="h-5 w-5 shrink-0 text-accent" />
                <span>{t("requestQuote.benefit3")}</span>
              </li>
              <li className="flex gap-2">
                <Calendar className="h-5 w-5 shrink-0 text-accent" />
                <span>{t("requestQuote.benefit4")}</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h3 className="font-semibold text-foreground">{t("requestQuote.contactDirectly")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-brand-dark" />
                <a href={`tel:${brand.support.phoneTel}`} className="hover:text-brand-dark" data-testid="link-phone">{brand.support.phone}</a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-brand-dark" />
                <a href={`mailto:${brand.support.infoEmail}`} className="hover:text-brand-dark" data-testid="link-email">{brand.support.infoEmail}</a>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-brand-dark mt-0.5 shrink-0" />
                <span>{brand.address.full}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-brand-dark" />
                <span>{t("requestQuote.responseTime")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
