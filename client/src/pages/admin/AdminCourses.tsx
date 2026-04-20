import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface AdminCourse {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  price: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCourses() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ courses: AdminCourse[] }>({
    queryKey: ["/api/admin/courses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Course deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const courses = data?.courses ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold" data-testid="text-admin-courses-title">Courses</h1>
          <Button asChild data-testid="button-create-course">
            <Link href="/admin/courses/new">
              <Plus className="h-4 w-4 mr-1" />
              New Course
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground text-center py-12" data-testid="text-no-courses">
            No courses yet. Create your first course.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} data-testid={`card-course-${course.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  <Badge variant={course.isActive ? "default" : "secondary"} data-testid={`badge-course-status-${course.id}`}>
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium" data-testid={`text-course-price-${course.id}`}>
                      ${parseFloat(course.price).toFixed(2)}
                    </span>
                    {course.category && (
                      <Badge variant="outline">{course.category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button size="sm" variant="outline" asChild data-testid={`button-edit-course-${course.id}`}>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(course.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-course-${course.id}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
