import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface AdminEnrollment {
  id: number;
  userId: number | null;
  courseId: number;
  orderId: number;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  userName: string | null;
  userEmail: string | null;
  courseName: string;
  companyId: number | null;
  companyName: string | null;
}

export default function AdminEnrollments() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<number | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user");
    if (userId) {
      setUserFilter(parseInt(userId));
    }
  }, []);

  const { data, isLoading } = useQuery<{ enrollments: AdminEnrollment[] }>({
    queryKey: ["/api/admin/enrollments"],
  });

  const enrollments = data?.enrollments ?? [];

  const filtered = enrollments.filter((e) => {
    if (userFilter && e.userId !== userFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !e.userName?.toLowerCase().includes(q) &&
        !e.userEmail?.toLowerCase().includes(q) &&
        !e.courseName.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default" as const;
      case "active": return "secondary" as const;
      case "revoked": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  const filteredUserInfo = userFilter
    ? enrollments.find((e) => e.userId === userFilter)
    : null;

  const clearUserFilter = () => {
    setUserFilter(null);
    navigate("/admin/enrollments");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-enrollments-title">Enrollments</h1>
        <div className="flex items-center gap-4 flex-wrap">
          {userFilter && (
            <Badge variant="secondary" data-testid="badge-user-filter">
              Filtered by: {filteredUserInfo?.userName || filteredUserInfo?.userEmail || `User #${userFilter}`}
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 ml-1 p-0"
                onClick={clearUserFilter}
                data-testid="button-clear-user-filter"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-enrollment-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search by name, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
            data-testid="input-enrollment-search"
          />
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Learner</TableHead>
                  <TableHead>{t("adminCompany.company")}</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((enrollment) => (
                  <TableRow key={enrollment.id} data-testid={`row-enrollment-${enrollment.id}`}>
                    <TableCell>{enrollment.id}</TableCell>
                    <TableCell data-testid={`text-enrollment-user-${enrollment.id}`}>
                      {enrollment.userName ? (
                        <div>
                          <div className="font-medium">{enrollment.userName}</div>
                          <div className="text-xs text-muted-foreground">{enrollment.userEmail}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-enrollment-company-${enrollment.id}`}>
                      {enrollment.companyName ? (
                        <Link href={`/admin/companies/${enrollment.companyId}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {enrollment.companyName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">{t("adminCompany.noCompany")}</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-enrollment-course-${enrollment.id}`}>
                      {enrollment.courseName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(enrollment.status)} data-testid={`badge-enrollment-status-${enrollment.id}`}>
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {enrollment.completedAt
                        ? new Date(enrollment.completedAt).toLocaleDateString()
                        : "--"}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No enrollments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
