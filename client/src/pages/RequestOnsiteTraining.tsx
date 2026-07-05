import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building2, Users, MapPin, Phone, Mail, Calendar, ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";

const EQUIPMENT_ENTRIES = [
  { value: "Counterbalance Forklift", key: "onsiteTraining.equipCounterbalance" },
  { value: "Reach Truck", key: "onsiteTraining.equipReachTruck" },
  { value: "Order Picker", key: "onsiteTraining.equipOrderPicker" },
  { value: "Scissor Lift", key: "onsiteTraining.equipScissorLift" },
  { value: "Boom/Aerial Lift", key: "onsiteTraining.equipBoomLift" },
  { value: "Other", key: "onsiteTraining.equipOther" },
] as const;

const TRAINING_ENTRIES = [
  { value: "Initial Certification", key: "onsiteTraining.typeInitialCert" },
  { value: "Recertification", key: "onsiteTraining.typeRecert" },
  { value: "Refresher", key: "onsiteTraining.typeRefresher" },
  { value: "Evaluation Only", key: "onsiteTraining.typeEvalOnly" },
] as const;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const formSchema = z.object({
  companyName: z.string().optional(),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  trainingAddress: z.string().min(5, "Please enter a street address"),
  city: z.string().min(2, "Please enter a city"),
  state: z.string().min(2, "Please select a state"),
  zip: z.string().min(5, "Please enter a valid ZIP code"),
  traineeCount: z.coerce.number().int().min(1, "Must have at least 1 trainee").max(1000, "Please contact us for groups over 1000"),
  preferredDate1: z.string().optional(),
  preferredDate2: z.string().optional(),
  preferredDate3: z.string().optional(),
  equipmentTypes: z.array(z.string()).min(1, "Please select at least one equipment type"),
  trainingType: z.string().min(1, "Please select a training type"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function RequestOnsiteTraining() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      trainingAddress: "",
      city: "",
      state: "",
      zip: "",
      traineeCount: 1,
      preferredDate1: "",
      preferredDate2: "",
      preferredDate3: "",
      equipmentTypes: [],
      trainingType: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest("POST", "/api/onsite-requests", data),
    onSuccess: () => {
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
          title={t("seo.requestOnsiteTraining.title", { brand: brand.name })}
          description={t("seo.requestOnsiteTraining.description", { brand: brand.name, body: industry.regulatory.body })}
        />
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="h-20 w-20 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-success-title">{t("onsiteTraining.successTitle")}</h1>
          <p className="text-muted-foreground text-lg">
            {t("onsiteTraining.successMessage")}
          </p>
          <div className="bg-muted rounded-lg p-5 text-left space-y-2">
            <p className="font-semibold text-foreground">{t("onsiteTraining.whatsNext")}</p>
            <ul className="text-muted-foreground text-sm space-y-1">
              <li>✓ {t("onsiteTraining.step1")}</li>
              <li>✓ {t("onsiteTraining.step2")}</li>
              <li>✓ {t("onsiteTraining.step3")}</li>
              <li>✓ {t("onsiteTraining.step4")}</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("onsiteTraining.questionsCall")} <a href={`tel:${brand.support.phoneTel}`} className="text-brand-dark font-medium">{brand.support.phone}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={t("seo.requestOnsiteTraining.title", { brand: brand.name })}
        description={t("seo.requestOnsiteTraining.description", { brand: brand.name, body: industry.regulatory.body })}
        canonical="/request-onsite-training"
      />

      <div className="bg-brand-dark text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-page-title">{t("onsiteTraining.pageTitle")}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            {t("onsiteTraining.pageSubtitle")}
          </p>
          <p className="text-blue-200 text-sm mt-3 italic">
            {t("onsiteTraining.pageNote")}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-foreground">{t("onsiteTraining.formTitle")}</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onsiteTraining.contactName")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Smith" {...field} data-testid="input-contact-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onsiteTraining.companyName")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Logistics Co." {...field} data-testid="input-company-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onsiteTraining.emailAddress")}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@company.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onsiteTraining.phoneNumber")}</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 555-5555" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-3">{t("onsiteTraining.trainingAddress")}</p>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="trainingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t("onsiteTraining.streetAddress")} {...field} data-testid="input-training-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-6 gap-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="col-span-3">
                            <FormControl>
                              <Input placeholder={t("onsiteTraining.city")} {...field} data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-state">
                                  <SelectValue placeholder={t("onsiteTraining.state")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {US_STATES.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormControl>
                              <Input placeholder={t("onsiteTraining.zip")} maxLength={10} {...field} data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="traineeCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onsiteTraining.numberOfTrainees")}</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="e.g. 10" {...field} data-testid="input-trainee-count" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trainingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onsiteTraining.trainingType")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-training-type">
                              <SelectValue placeholder={t("onsiteTraining.selectTrainingType")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRAINING_ENTRIES.map((tt) => (
                              <SelectItem key={tt.value} value={tt.value}>{t(tt.key)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="equipmentTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t("onsiteTraining.equipmentTypes")}</FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-1" data-testid="equipment-types-group">
                        {EQUIPMENT_ENTRIES.map((eq) => (
                          <FormField
                            key={eq.value}
                            control={form.control}
                            name="equipmentTypes"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(eq.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value ?? [];
                                      field.onChange(
                                        checked ? [...current, eq.value] : current.filter((v) => v !== eq.value)
                                      );
                                    }}
                                    data-testid={`checkbox-equipment-${eq.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">{t(eq.key)}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <p className="text-sm font-medium text-foreground mb-3">{t("onsiteTraining.preferredDates")}</p>
                  <p className="text-xs text-muted-foreground mb-3">{t("onsiteTraining.preferredDatesNote")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["preferredDate1", "preferredDate2", "preferredDate3"] as const).map((name, i) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">{t("onsiteTraining.dateLabel", { num: i + 1 })}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid={`input-preferred-date-${i + 1}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onsiteTraining.additionalNotes")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("onsiteTraining.notesPlaceholder", { body: industry.regulatory.body })}
                          rows={4}
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mutation.isError && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-3" data-testid="text-error-message">
                    {t("onsiteTraining.errorMessage", { phone: brand.support.phone })}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent text-accent-foreground border-accent-border"
                  disabled={mutation.isPending}
                  data-testid="button-submit-request"
                >
                  {mutation.isPending ? t("onsiteTraining.submitting") : t("onsiteTraining.submitRequest")}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {t("onsiteTraining.noPaymentNote")}
                </p>
              </form>
            </Form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-dark text-white rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4">{t("onsiteTraining.whyChooseOnsite")}</h3>
            <ul className="space-y-3 text-white/80 text-sm">
              <li className="flex gap-2">
                <Building2 className="h-5 w-5 shrink-0 text-accent" />
                <span dangerouslySetInnerHTML={{ __html: t("onsiteTraining.benefitFacility") }} />
              </li>
              <li className="flex gap-2">
                <Users className="h-5 w-5 shrink-0 text-accent" />
                <span dangerouslySetInnerHTML={{ __html: t("onsiteTraining.benefitGroups") }} />
              </li>
              <li className="flex gap-2">
                <ClipboardList className="h-5 w-5 shrink-0 text-accent" />
                <span dangerouslySetInnerHTML={{ __html: t("onsiteTraining.benefitCurriculum", { body: industry.regulatory.body }) }} />
              </li>
              <li className="flex gap-2">
                <Calendar className="h-5 w-5 shrink-0 text-accent" />
                <span dangerouslySetInnerHTML={{ __html: t("onsiteTraining.benefitScheduling") }} />
              </li>
            </ul>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">{t("onsiteTraining.pricingGuide")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("onsiteTraining.tier1")}</span>
                <span className="font-medium">{t("onsiteTraining.tier1Price")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("onsiteTraining.tier2")}</span>
                <span className="font-medium">{t("onsiteTraining.tier2Price")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("onsiteTraining.tier3")}</span>
                <span className="font-medium">{t("onsiteTraining.tier3Price")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("onsiteTraining.tier4")}</span>
                <span className="font-medium">{t("onsiteTraining.tier4Price")}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("onsiteTraining.travelNote")}</p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h3 className="font-semibold text-foreground">{t("onsiteTraining.contactDirectly")}</h3>
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
                <span>{t("onsiteTraining.servingAreas")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
