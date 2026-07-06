import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, QrCode, Search, Tag, Loader2 } from "lucide-react";
import DiscountShareTools from "@/components/discounts/DiscountShareTools";

interface AdminDiscountCode {
  id: number;
  code: string;
  description: string | null;
  discountType: "percent" | "fixed";
  amount: string;
  active: boolean;
  maxRedemptions: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  redemptionCount: number;
  totalDiscounted: number;
}

interface DiscountFormState {
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  amount: string;
  active: boolean;
  maxRedemptions: string;
  startsAt: string;
  endsAt: string;
}

const EMPTY_FORM: DiscountFormState = {
  code: "",
  description: "",
  discountType: "percent",
  amount: "",
  active: true,
  maxRedemptions: "",
  startsAt: "",
  endsAt: "",
};

function formatDiscount(code: AdminDiscountCode): string {
  return code.discountType === "percent"
    ? `${Number(code.amount)}% off`
    : `$${Number(code.amount).toFixed(2)} off`;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function AdminDiscounts() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DiscountFormState>(EMPTY_FORM);
  const [shareCode, setShareCode] = useState<AdminDiscountCode | null>(null);

  const { data, isLoading } = useQuery<{ codes: AdminDiscountCode[] }>({
    queryKey: ["/api/admin/discount-codes"],
  });

  const codes = data?.codes ?? [];

  const filtered = useMemo(() => {
    if (!search) return codes;
    const s = search.toLowerCase();
    return codes.filter(
      (c) => c.code.toLowerCase().includes(s) || (c.description || "").toLowerCase().includes(s)
    );
  }, [codes, search]);

  function buildPayload() {
    return {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discountType: form.discountType,
      amount: Number(form.amount),
      active: form.active,
      maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
      startsAt: form.startsAt ? new Date(`${form.startsAt}T00:00:00`).toISOString() : null,
      endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : null,
    };
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      const res = editingId
        ? await apiRequest("PATCH", `/api/admin/discount-codes/${editingId}`, payload)
        : await apiRequest("POST", "/api/admin/discount-codes", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: editingId ? "Code updated" : "Code created" });
      setFormOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiRequest("PATCH", `/api/admin/discount-codes/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "Code updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(code: AdminDiscountCode) {
    setEditingId(code.id);
    setForm({
      code: code.code,
      description: code.description || "",
      discountType: code.discountType,
      amount: String(Number(code.amount)),
      active: code.active,
      maxRedemptions: code.maxRedemptions != null ? String(code.maxRedemptions) : "",
      startsAt: toDateInputValue(code.startsAt),
      endsAt: toDateInputValue(code.endsAt),
    });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.code.trim()) {
      toast({ title: "Enter a code", variant: "destructive" });
      return;
    }
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (form.discountType === "percent" && amount > 100) {
      toast({ title: "Percent discount cannot exceed 100", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  }

  const activeCount = codes.filter((c) => c.active).length;
  const totalRedemptions = codes.reduce((sum, c) => sum + c.redemptionCount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-discounts-title">Discount Codes</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <p className="text-sm text-muted-foreground">
                {activeCount} active code{activeCount !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalRedemptions} total redemption{totalRedemptions !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button onClick={openCreate} data-testid="button-create-discount">
            <Plus className="h-4 w-4 mr-2" />
            New Code
          </Button>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-discounts"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 md:h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden" data-testid="list-discounts-mobile">
              {filtered.map((code) => (
                <Card key={code.id} data-testid={`card-discount-${code.code}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono font-bold flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          {code.code}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{formatDiscount(code)}</p>
                        {code.description && (
                          <p className="text-xs text-muted-foreground mt-1">{code.description}</p>
                        )}
                      </div>
                      <Badge variant={code.active ? "default" : "secondary"}>
                        {code.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {code.redemptionCount} use{code.redemptionCount !== 1 ? "s" : ""}
                        {code.maxRedemptions != null ? ` of ${code.maxRedemptions}` : ""}
                      </span>
                      <span>${code.totalDiscounted.toFixed(2)} discounted</span>
                      {code.endsAt && <span>Ends {new Date(code.endsAt).toLocaleDateString()}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setShareCode(code)} data-testid={`button-share-${code.code}`}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(code)} data-testid={`button-edit-${code.code}`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  {codes.length === 0 ? "No discount codes yet. Create one to get started." : "No codes match your search."}
                </p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="border rounded-md hidden md:block" data-testid="table-discounts-desktop">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Total Discounted</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((code) => (
                    <TableRow key={code.id} data-testid={`row-discount-${code.code}`}>
                      <TableCell>
                        <p className="font-mono font-medium">{code.code}</p>
                        {code.description && (
                          <p className="text-xs text-muted-foreground max-w-[240px] truncate">{code.description}</p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDiscount(code)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={code.active}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: code.id, active: checked })}
                            disabled={toggleMutation.isPending}
                            data-testid={`switch-active-${code.code}`}
                          />
                          <span className="text-sm text-muted-foreground">{code.active ? "Active" : "Inactive"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {code.redemptionCount}
                        {code.maxRedemptions != null && (
                          <span className="text-muted-foreground"> / {code.maxRedemptions}</span>
                        )}
                      </TableCell>
                      <TableCell>${code.totalDiscounted.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {code.startsAt || code.endsAt ? (
                          <>
                            {code.startsAt ? new Date(code.startsAt).toLocaleDateString() : "Now"}
                            {" - "}
                            {code.endsAt ? new Date(code.endsAt).toLocaleDateString() : "No end"}
                          </>
                        ) : (
                          "Always"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShareCode(code)} title="Share link and QR" data-testid={`button-share-${code.code}`}>
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(code)} title="Edit" data-testid={`button-edit-${code.code}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        {codes.length === 0 ? "No discount codes yet. Create one to get started." : "No codes match your search."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Discount Code" : "New Discount Code"}</DialogTitle>
            <DialogDescription>
              Customers enter this code at checkout, or use the share link to apply it automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount-code">Code</Label>
              <Input
                id="discount-code"
                placeholder="SPRING20"
                className="font-mono uppercase"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                data-testid="input-discount-code"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm({ ...form, discountType: v as "percent" | "fixed" })}
                >
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent off</SelectItem>
                    <SelectItem value="fixed">Dollar amount off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-amount">
                  {form.discountType === "percent" ? "Percent (1-100)" : "Amount ($)"}
                </Label>
                <Input
                  id="discount-amount"
                  type="number"
                  min="0"
                  max={form.discountType === "percent" ? "100" : undefined}
                  step={form.discountType === "percent" ? "1" : "0.01"}
                  placeholder={form.discountType === "percent" ? "20" : "25.00"}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  data-testid="input-discount-amount"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-description">Description (internal)</Label>
              <Textarea
                id="discount-description"
                placeholder="Spring flyer campaign - Alberto"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="input-discount-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-max">Max redemptions (blank = unlimited)</Label>
              <Input
                id="discount-max"
                type="number"
                min="1"
                step="1"
                placeholder="Unlimited"
                value={form.maxRedemptions}
                onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                data-testid="input-discount-max"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="discount-starts">Starts (optional)</Label>
                <Input
                  id="discount-starts"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  data-testid="input-discount-starts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-ends">Ends (optional)</Label>
                <Input
                  id="discount-ends"
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  data-testid="input-discount-ends"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="discount-active" className="cursor-pointer">Active</Label>
              <Switch
                id="discount-active"
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                data-testid="switch-discount-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-discount">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={shareCode !== null} onOpenChange={(open) => !open && setShareCode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {shareCode?.code}</DialogTitle>
            <DialogDescription>
              {shareCode ? `${formatDiscount(shareCode)} - give customers the link or let them scan the QR code.` : ""}
            </DialogDescription>
          </DialogHeader>
          {shareCode && <DiscountShareTools code={shareCode.code} />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
