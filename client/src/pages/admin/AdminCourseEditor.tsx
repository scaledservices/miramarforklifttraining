import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Save } from "lucide-react";
import LessonBlocksEditor from "./LessonBlocksEditor";

interface CourseData {
  id?: number;
  title: string;
  slug: string;
  description: string;
  price: string;
  category: string;
  isActive: boolean;
}

interface StepData {
  id?: number;
  courseId?: number;
  stepOrder: number;
  title: string;
  type: "content" | "lesson" | "video" | "exam" | "checkpoint" | "download";
  config: any;
  estimatedMinutes: number | null;
}

interface QuestionData {
  id?: number;
  stepId?: number;
  question: string;
  type: "mcq_single" | "mcq_multi";
  options: string[];
  correctAnswers: any;
  explanation: string;
  order: number;
}

export default function AdminCourseEditor() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new" || !params.id;
  const courseId = isNew ? null : parseInt(params.id!);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [course, setCourse] = useState<CourseData>({
    title: "",
    slug: "",
    description: "",
    price: "0.00",
    category: "",
    isActive: true,
  });

  const [steps, setSteps] = useState<StepData[]>([]);
  const [editingStep, setEditingStep] = useState<StepData | null>(null);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Record<number, QuestionData[]>>({});

  const { data: courseData, isLoading: courseLoading } = useQuery<{ course: any }>({
    queryKey: ["/api/admin/courses", courseId],
    enabled: !isNew && !!courseId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const allCourses = await fetch("/api/admin/courses", { credentials: "include" });
      const { courses } = await allCourses.json();
      const c = courses.find((c: any) => c.id === courseId);
      return { course: c };
    },
  });

  const { data: stepsData } = useQuery<{ steps: StepData[] }>({
    queryKey: ["/api/admin/courses", courseId, "steps"],
    enabled: !isNew && !!courseId,
  });

  useEffect(() => {
    if (courseData?.course) {
      const c = courseData.course;
      setCourse({
        title: c.title,
        slug: c.slug,
        description: c.description || "",
        price: c.price,
        category: c.category || "",
        isActive: c.isActive,
      });
    }
  }, [courseData]);

  useEffect(() => {
    if (stepsData?.steps) {
      setSteps(stepsData.steps);
    }
  }, [stepsData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        const res = await apiRequest("POST", "/api/admin/courses", course);
        return res.json();
      } else {
        const res = await apiRequest("PATCH", `/api/admin/courses/${courseId}`, course);
        return res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: isNew ? "Course created" : "Course updated" });
      if (isNew && data?.course?.id) {
        navigate(`/admin/courses/${data.course.id}/edit`);
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const stepMutation = useMutation({
    mutationFn: async (step: StepData) => {
      if (step.id) {
        const res = await apiRequest("PATCH", `/api/admin/steps/${step.id}`, {
          title: step.title,
          type: step.type,
          stepOrder: step.stepOrder,
          config: step.config,
          estimatedMinutes: step.estimatedMinutes,
        });
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/admin/courses/${courseId}/steps`, {
          title: step.title,
          type: step.type,
          stepOrder: step.stepOrder,
          config: step.config || {},
          estimatedMinutes: step.estimatedMinutes,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId, "steps"] });
      setStepDialogOpen(false);
      setEditingStep(null);
      toast({ title: "Step saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: number) => {
      await apiRequest("DELETE", `/api/admin/steps/${stepId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId, "steps"] });
      toast({ title: "Step deleted" });
    },
  });

  const loadQuestions = async (stepId: number) => {
    const res = await fetch(`/api/admin/steps/${stepId}/questions`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setQuestions((prev) => ({ ...prev, [stepId]: data.questions }));
    }
  };

  const questionMutation = useMutation({
    mutationFn: async (q: QuestionData) => {
      if (q.id) {
        const res = await apiRequest("PATCH", `/api/admin/questions/${q.id}`, {
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
          order: q.order,
        });
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/admin/steps/${q.stepId}/questions`, {
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
          order: q.order,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      if (selectedStepId) loadQuestions(selectedStepId);
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Question saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (qId: number) => {
      await apiRequest("DELETE", `/api/admin/questions/${qId}`);
    },
    onSuccess: () => {
      if (selectedStepId) loadQuestions(selectedStepId);
      toast({ title: "Question deleted" });
    },
  });

  const openNewStep = () => {
    setEditingStep({
      stepOrder: steps.length + 1,
      title: "",
      type: "content",
      config: {},
      estimatedMinutes: null,
    });
    setStepDialogOpen(true);
  };

  const openEditStep = (step: StepData) => {
    setEditingStep({ ...step });
    setStepDialogOpen(true);
  };

  const openQuestions = (stepId: number) => {
    setSelectedStepId(stepId);
    loadQuestions(stepId);
  };

  const openNewQuestion = () => {
    setEditingQuestion({
      stepId: selectedStepId!,
      question: "",
      type: "mcq_single",
      options: ["", "", "", ""],
      correctAnswers: 0,
      explanation: "",
      order: (questions[selectedStepId!]?.length || 0) + 1,
    });
    setQuestionDialogOpen(true);
  };

  if (!isNew && courseLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold" data-testid="text-course-editor-title">
          {isNew ? "New Course" : "Edit Course"}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  data-testid="input-course-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={course.slug}
                  onChange={(e) => setCourse({ ...course, slug: e.target.value })}
                  data-testid="input-course-slug"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={course.price}
                  onChange={(e) => setCourse({ ...course, price: e.target.value })}
                  data-testid="input-course-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={course.category}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                  data-testid="input-course-category"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                data-testid="input-course-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={course.isActive}
                onCheckedChange={(checked) => setCourse({ ...course, isActive: checked })}
                data-testid="switch-course-active"
              />
              <Label>Active</Label>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-save-course"
            >
              <Save className="h-4 w-4 mr-1" />
              {isNew ? "Create Course" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {!isNew && courseId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Steps</CardTitle>
              <Button size="sm" onClick={openNewStep} data-testid="button-add-step">
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No steps yet</p>
              ) : (
                <div className="space-y-2">
                  {steps
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((step, idx) => (
                      <div
                        key={step.id || idx}
                        className="flex items-center gap-2 p-3 border rounded-md flex-wrap"
                        data-testid={`step-item-${step.id}`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium flex-1 min-w-0">
                          {step.stepOrder}. {step.title}
                        </span>
                        <Badge variant="outline">{step.type}</Badge>
                        <div className="flex items-center gap-1 flex-wrap">
                          {idx > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const prev = steps[idx - 1];
                                if (step.id && prev.id) {
                                  stepMutation.mutate({ ...step, stepOrder: prev.stepOrder });
                                  stepMutation.mutate({ ...prev, stepOrder: step.stepOrder });
                                }
                              }}
                              data-testid={`button-move-up-${step.id}`}
                            >
                              <ArrowUp />
                            </Button>
                          )}
                          {idx < steps.length - 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const next = steps[idx + 1];
                                if (step.id && next.id) {
                                  stepMutation.mutate({ ...step, stepOrder: next.stepOrder });
                                  stepMutation.mutate({ ...next, stepOrder: step.stepOrder });
                                }
                              }}
                              data-testid={`button-move-down-${step.id}`}
                            >
                              <ArrowDown />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditStep(step)}
                            data-testid={`button-edit-step-${step.id}`}
                          >
                            Edit
                          </Button>
                          {(step.type === "exam" || step.type === "checkpoint") && step.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openQuestions(step.id!)}
                              data-testid={`button-questions-${step.id}`}
                            >
                              Questions
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => step.id && deleteStepMutation.mutate(step.id)}
                            data-testid={`button-delete-step-${step.id}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedStepId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>
                Questions for Step #{steps.find((s) => s.id === selectedStepId)?.stepOrder}
              </CardTitle>
              <Button size="sm" onClick={openNewQuestion} data-testid="button-add-question">
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              {(!questions[selectedStepId] || questions[selectedStepId].length === 0) ? (
                <p className="text-muted-foreground text-center py-4">No questions yet</p>
              ) : (
                <div className="space-y-2">
                  {questions[selectedStepId].map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="flex items-center gap-2 p-3 border rounded-md flex-wrap"
                      data-testid={`question-item-${q.id}`}
                    >
                      <span className="text-sm flex-1 min-w-0">{q.order}. {q.question}</span>
                      <Badge variant="outline">{q.type}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingQuestion({ ...q });
                          setQuestionDialogOpen(true);
                        }}
                        data-testid={`button-edit-question-${q.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => q.id && deleteQuestionMutation.mutate(q.id)}
                        data-testid={`button-delete-question-${q.id}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={stepDialogOpen} onOpenChange={(open) => { if (!open) { setStepDialogOpen(false); setEditingStep(null); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStep?.id ? "Edit Step" : "New Step"}</DialogTitle>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingStep.title}
                  onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                  data-testid="input-step-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editingStep.type}
                  onValueChange={(val: StepData["type"]) =>
                    setEditingStep({ ...editingStep, type: val })
                  }
                >
                  <SelectTrigger data-testid="select-step-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="lesson">Lesson</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="checkpoint">Checkpoint</SelectItem>
                    <SelectItem value="download">Download</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={editingStep.stepOrder}
                  onChange={(e) =>
                    setEditingStep({ ...editingStep, stepOrder: parseInt(e.target.value) || 1 })
                  }
                  data-testid="input-step-order"
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Minutes</Label>
                <Input
                  type="number"
                  value={editingStep.estimatedMinutes ?? ""}
                  onChange={(e) =>
                    setEditingStep({
                      ...editingStep,
                      estimatedMinutes: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  data-testid="input-step-minutes"
                />
              </div>
              {(editingStep.type === "content" || editingStep.type === "lesson") && (
                <LessonBlocksEditor
                  value={editingStep.config || {}}
                  onChange={(config) => setEditingStep({ ...editingStep, config })}
                />
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStepDialogOpen(false); setEditingStep(null); }} data-testid="button-cancel-step">
              Cancel
            </Button>
            <Button
              onClick={() => editingStep && stepMutation.mutate(editingStep)}
              disabled={stepMutation.isPending}
              data-testid="button-save-step"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={questionDialogOpen} onOpenChange={(open) => { if (!open) { setQuestionDialogOpen(false); setEditingQuestion(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion?.id ? "Edit Question" : "New Question"}</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  data-testid="input-question-text"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editingQuestion.type}
                  onValueChange={(val: "mcq_single" | "mcq_multi") =>
                    setEditingQuestion({ ...editingQuestion, type: val })
                  }
                >
                  <SelectTrigger data-testid="select-question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq_single">Single Choice</SelectItem>
                    <SelectItem value="mcq_multi">Multiple Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                {editingQuestion.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 flex-wrap">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[idx] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      placeholder={`Option ${idx + 1}`}
                      data-testid={`input-option-${idx}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const newOpts = editingQuestion.options.filter((_, i) => i !== idx);
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      data-testid={`button-remove-option-${idx}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditingQuestion({
                      ...editingQuestion,
                      options: [...editingQuestion.options, ""],
                    })
                  }
                  data-testid="button-add-option"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Correct Answer (index, 0-based)</Label>
                <Input
                  value={JSON.stringify(editingQuestion.correctAnswers)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditingQuestion({ ...editingQuestion, correctAnswers: parsed });
                    } catch {
                      setEditingQuestion({ ...editingQuestion, correctAnswers: e.target.value });
                    }
                  }}
                  data-testid="input-correct-answer"
                />
              </div>
              <div className="space-y-2">
                <Label>Explanation</Label>
                <Textarea
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  data-testid="input-question-explanation"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setQuestionDialogOpen(false); setEditingQuestion(null); }} data-testid="button-cancel-question">
              Cancel
            </Button>
            <Button
              onClick={() => editingQuestion && questionMutation.mutate(editingQuestion)}
              disabled={questionMutation.isPending}
              data-testid="button-save-question"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
