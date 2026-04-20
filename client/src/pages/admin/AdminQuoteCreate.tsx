import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAllLocations } from "@shared/config/locations";
import { insertQuoteSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const EQUIPMENT_OPTIONS = [
  "sit_down_counterbalance",
  "stand_up_counterbalance",
  "reach_truck",
  "order_picker",
  "pallet_jack",
  "scissor_lift",
  "boom_lift",
] as const;

function urlParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function dollarsToCents(v: string): number {
  const n = parseFloat(v);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

const optionalIdString = z
  .string()
  .optional()
  .refine((v) => !v || /^\d+$/.test(v), "Must be a positive integer")
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalMoneyString = z
  .string()
  .optional()
  .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "Enter a dollar amount")
  .transform((v) => (v && v.length > 0 ? v : undefined));

const formSchema = insertQuoteSchema
  .pick({ title: true, equipmentTypes: true, pricingNotes: true, internalNotes: true })
  .extend({
    title: z.string().trim().min(1, "Title is required"),
    equipmentTypes: z.array(z.string()).default([]),
    pricingNotes: z.string().optional(),
    internalNotes: z.string().optional(),
    companyId: optionalIdString,
    contactId: optionalIdString,
    originatingLeadId: optionalIdString,
    participantCount: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+$/.test(v), "Must be a positive integer")
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    locationType: z.enum(["facility", "customer_onsite"]),
    locationSlug: z.string().optional(),
    onsiteStreet: z.string().optional(),
    onsiteCity: z.string().optional(),
    onsiteState: z.string().optional(),
    onsiteZip: z.string().optional(),
    subtotalDollars: optionalMoneyString,
    totalDollars: optionalMoneyString,
    validUntil: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.locationType === "facility" && !data.locationSlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a facility",
        path: ["locationSlug"],
      });
    }
    if (data.locationType === "customer_onsite") {
      if (!data.onsiteCity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City is required for on-site",
          path: ["onsiteCity"],
        });
      }
      if (!data.onsiteState) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "State is required for on-site",
          path: ["onsiteState"],
        });
      }
    }
  });

type FormValues = z.input<typeof formSchema>;
type FormValuesOut = z.output<typeof formSchema>;

export default function AdminQuoteCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const allLocations = getAllLocations();

  const prefillLeadId = urlParam("leadId");
  const prefillCompanyId = urlParam("companyId");
  const prefillContactId = urlParam("contactId");

  const form = useForm<FormValues, unknown, FormValuesOut>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      companyId: prefillCompanyId ?? "",
      contactId: prefillContactId ?? "",
      originatingLeadId: prefillLeadId ?? "",
      participantCount: "",
      locationType: "facility",
      locationSlug: "",
      onsiteStreet: "",
      onsiteCity: "",
      onsiteState: "",
      onsiteZip: "",
      equipmentTypes: [],
      subtotalDollars: "",
      totalDollars: "",
      pricingNotes: "",
      internalNotes: "",
      validUntil: "",
    },
  });

  const locationType = form.watch("locationType");
  const equipmentTypes = form.watch("equipmentTypes") ?? [];

  const createMutation = useMutation({
    mutationFn: (data: FormValuesOut) => {
      const subtotalCents = data.subtotalDollars ? dollarsToCents(data.subtotalDollars) : 0;
      const totalCents = data.totalDollars
        ? dollarsToCents(data.totalDollars)
        : subtotalCents;
      const payload = {
        title: data.title,
        companyId: data.companyId ? Number(data.companyId) : undefined,
        contactId: data.contactId ? Number(data.contactId) : undefined,
        originatingLeadId: data.originatingLeadId ? Number(data.originatingLeadId) : undefined,
        participantCount: data.participantCount ? Number(data.participantCount) : undefined,
        locationType: data.locationType,
        locationSlug: data.locationType === "facility" ? data.locationSlug || undefined : undefined,
        onsiteStreet: data.locationType === "customer_onsite" ? data.onsiteStreet || undefined : undefined,
        onsiteCity: data.locationType === "customer_onsite" ? data.onsiteCity || undefined : undefined,
        onsiteState: data.locationType === "customer_onsite" ? data.onsiteState || undefined : undefined,
        onsiteZip: data.locationType === "customer_onsite" ? data.onsiteZip || undefined : undefined,
        equipmentTypes: data.equipmentTypes ?? [],
        subtotal: subtotalCents,
        total: totalCents,
        pricingNotes: data.pricingNotes || undefined,
        internalNotes: data.internalNotes || undefined,
        validUntil: data.validUntil
          ? new Date(`${data.validUntil}T00:00:00Z`).toISOString()
          : undefined,
      };
      return apiRequest("POST", "/api/admin/quotes", payload);
    },
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Quote created" });
      navigate(`/admin/quotes/${data.quote.id}`);
    },
    onError: (e: Error) =>
      toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const toggleEquipment = (eq: string) => {
    const current = form.getValues("equipmentTypes") ?? [];
    const next = current.includes(eq) ? current.filter((e) => e !== eq) : [...current, eq];
    form.setValue("equipmentTypes", next, { shouldDirty: true });
  };

  const onSubmit = (data: FormValuesOut) => createMutation.mutate(data);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl" data-testid="admin-quote-create">
        <div className="flex items-center gap-4">
          <Link href="/admin/quotes">
            <Button variant="ghost" size="icon" data-testid="button-back-quotes">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">New Quote</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="border rounded-lg p-5 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Acme Corp — On-Site Forklift Training" data-testid="input-quote-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company ID</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="number" data-testid="input-company-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact ID</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="number" data-testid="input-contact-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="originatingLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead ID</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="number" data-testid="input-lead-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="participantCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participants</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="number" min="0" data-testid="input-participants" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="date" data-testid="input-valid-until" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-location-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="facility">Facility</SelectItem>
                      <SelectItem value="customer_onsite">Customer On-Site</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {locationType === "facility" ? (
              <FormField
                control={form.control}
                name="locationSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility *</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-facility">
                          <SelectValue placeholder="Choose facility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allLocations.map((l) => (
                          <SelectItem key={l.slug} value={l.slug}>{l.displayName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="onsiteStreet"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} data-testid="input-onsite-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="onsiteCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} data-testid="input-onsite-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="onsiteState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} maxLength={2} data-testid="input-onsite-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="onsiteZip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} data-testid="input-onsite-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div>
              <FormLabel>Equipment Types</FormLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <label key={eq} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={equipmentTypes.includes(eq)}
                      onCheckedChange={() => toggleEquipment(eq)}
                      data-testid={`checkbox-equipment-${eq}`}
                    />
                    <span className="capitalize">{eq.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="subtotalDollars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal (USD)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="number" step="0.01" min="0" data-testid="input-subtotal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalDollars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total (USD)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="number" step="0.01" min="0" data-testid="input-total" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pricingNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing Notes (visible on quote)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={3} data-testid="textarea-create-pricing-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={2} data-testid="textarea-create-internal-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/admin/quotes">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit-quote"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Quote
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
