import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Pencil, ShoppingCart, Users } from "lucide-react";
import type { AdminUser } from "@/pages/admin/AdminUsers";

interface Props {
  user: AdminUser;
  currentUserRole?: string;
  onRoleChange: (id: number, role: string) => void;
  onViewEnrollments: (id: number) => void;
  onViewOrders: (id: number) => void;
  onEdit: (user: AdminUser) => void;
}

/** Mobile-first card for one user: role select plus big tap targets for the row actions. */
export default function UserCard({
  user,
  currentUserRole,
  onRoleChange,
  onViewEnrollments,
  onViewOrders,
  onEdit,
}: Props) {
  const isSuperAdmin = currentUserRole === "super_admin";
  const roleLocked = !isSuperAdmin && (user.role === "admin" || user.role === "super_admin");

  return (
    <Card data-testid={`card-user-${user.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium truncate" data-testid={`text-user-name-${user.id}`}>
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid={`text-user-email-${user.id}`}>
              {user.email}
            </p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={user.role}
            onValueChange={(role) => onRoleChange(user.id, role)}
            disabled={roleLocked}
            data-testid={`select-role-${user.id}`}
          >
            <SelectTrigger className="w-44" data-testid={`select-role-trigger-${user.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="certified_student">Certified Student</SelectItem>
              <SelectItem value="instructor_applicant">Instructor Applicant</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="group_admin">Crew Admin</SelectItem>
              {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
              {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
            </SelectContent>
          </Select>
          {user.role === "group_admin" && user.groupName && (
            <Badge variant="secondary" data-testid={`badge-group-${user.id}`}>
              <Users className="h-3 w-3 mr-1" />
              {user.groupName}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewEnrollments(user.id)}
            data-testid={`button-view-enrollments-${user.id}`}
          >
            <BookOpen className="h-4 w-4 mr-1.5" /> Courses
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewOrders(user.id)}
            data-testid={`button-view-orders-${user.id}`}
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" /> Orders
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(user)}
            data-testid={`button-edit-user-${user.id}`}
          >
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
