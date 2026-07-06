import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Pencil, BookOpen, ShoppingCart, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserCard from "@/components/admin/users/UserCard";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  groupName: string | null;
  groupId: number | null;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();

  const { data, isLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ["/api/admin/users"],
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const nameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditUser(null);
      toast({ title: "Name updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const users = data?.users ?? [];
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" data-testid="text-admin-users-title">Users</h1>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-users"
          />
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden" data-testid="list-users-mobile">
              {filtered.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentUserRole={currentUser?.role}
                  onRoleChange={(id, role) => roleMutation.mutate({ id, role })}
                  onViewEnrollments={(id) => navigate(`/admin/enrollments?user=${id}`)}
                  onViewOrders={(id) => navigate(`/admin/orders?user=${id}`)}
                  onEdit={(u) => {
                    setEditUser(u);
                    setEditName(u.name);
                  }}
                />
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-10">No users found</p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="border rounded-md hidden md:block" data-testid="table-users-desktop">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell data-testid={`text-user-name-${user.id}`}>{user.name}</TableCell>
                    <TableCell data-testid={`text-user-email-${user.id}`}>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(role) => roleMutation.mutate({ id: user.id, role })}
                        disabled={currentUser?.role !== "super_admin" && (user.role === "admin" || user.role === "super_admin")}
                        data-testid={`select-role-${user.id}`}
                      >
                        <SelectTrigger className="w-36" data-testid={`select-role-trigger-${user.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="certified_student">Certified Student</SelectItem>
                          <SelectItem value="instructor_applicant">Instructor Applicant</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="group_admin">Crew Admin</SelectItem>
                          {currentUser?.role === "super_admin" && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                          {currentUser?.role === "super_admin" && (
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell data-testid={`text-user-group-${user.id}`}>
                      {user.role === "group_admin" && user.groupName ? (
                        <Badge variant="secondary" data-testid={`badge-group-${user.id}`}>
                          <Users className="h-3 w-3 mr-1" />
                          {user.groupName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/admin/enrollments?user=${user.id}`)}
                          title="View Enrollments"
                          data-testid={`button-view-enrollments-${user.id}`}
                        >
                          <BookOpen />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/admin/orders?user=${user.id}`)}
                          title="View Orders"
                          data-testid={`button-view-orders-${user.id}`}
                        >
                          <ShoppingCart />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditUser(user);
                            setEditName(user.name);
                          }}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Pencil />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Name"
            data-testid="input-edit-user-name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button
              onClick={() => editUser && nameMutation.mutate({ id: editUser.id, name: editName })}
              disabled={nameMutation.isPending}
              data-testid="button-save-user"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
