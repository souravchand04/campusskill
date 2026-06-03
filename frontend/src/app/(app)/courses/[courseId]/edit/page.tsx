'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { courseService } from '@/services/course.service';
import { collegeService } from '@/services/college.service';
import { userService } from '@/services/user.service';
import {
  ChevronLeft,
  Plus,
  X,
  Save,
  Trash2,
  Edit,
  BookOpen,
  Layers,
  FileText,
  Video,
  ChevronDown,
  GripVertical,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const editCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  shortDescription: z.string().max(300).optional().or(z.literal('')),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.coerce.number().int().positive('Duration must be positive'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater').default(0),
  thumbnail: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  collegeId: z.string().optional(),
  trainerId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  totalModules: z.coerce.number().int().min(0).default(0),
  totalLessons: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

type EditCourseFormValues = z.infer<typeof editCourseSchema>;

const categoryOptions = [
  'full_stack_development',
  'devops',
  'cloud_computing',
  'java',
  'dotnet',
  'python',
  'data_science',
  'artificial_intelligence',
  'mobile_development',
  'cybersecurity',
];

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { user } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');
  const [prereqInput, setPrereqInput] = React.useState('');
  const [colleges, setColleges] = React.useState<any[]>([]);
  const [trainers, setTrainers] = React.useState<any[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [course, setCourse] = React.useState<any>(null);

  const userRole = (user?.role || '').toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const isCollegeAdmin = userRole === 'admin' || userRole === 'college_admin';
  const canManageAll = isSuperAdmin || isCollegeAdmin;

  const form = useForm<EditCourseFormValues>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      description: '',
      category: '',
      level: 'beginner',
      duration: 0,
      price: 0,
      thumbnail: '',
      collegeId: '',
      trainerId: '',
      tags: [],
      prerequisites: [],
      learningObjectives: [],
      totalModules: 0,
      totalLessons: 0,
      isPublished: false,
    },
  });

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setFetchError(null);

        const [courseRes, collegesRes, usersRes] = await Promise.allSettled([
          courseService.getById(courseId),
          collegeService.getAll({ limit: 100 }),
          userService.getAll(),
        ]);

        if (collegesRes.status === 'fulfilled') {
          const data = collegesRes.value.data?.data || collegesRes.value.data || [];
          setColleges(Array.isArray(data) ? data : []);
        }

        if (usersRes.status === 'fulfilled') {
          const data = usersRes.value.data?.data || usersRes.value.data || [];
          const allUsers = Array.isArray(data) ? data : [];
          const trainerList = allUsers.filter((u: any) => {
            const role = (u.role || '').toUpperCase();
            return role === 'TRAINER' || role === 'INSTRUCTOR';
          });
          setTrainers(trainerList);
        }

        if (courseRes.status === 'fulfilled') {
          const c = courseRes.value.data.data;
          setCourse(c);
          const instructorId = typeof c.instructor === 'string'
            ? c.instructor
            : c.instructor?._id || (c.instructor as any)?.id || '';

          form.reset({
            title: c.title || '',
            shortDescription: c.shortDescription || '',
            description: c.description || '',
            category: c.category || '',
            level: c.level || 'beginner',
            duration: c.duration || 0,
            price: c.price ?? 0,
            thumbnail: c.thumbnail || '',
            collegeId: (c as any).collegeId || c.college || '',
            trainerId: instructorId,
            tags: (c as any).tags || [],
            prerequisites: (c as any).prerequisites || [],
            learningObjectives: (c as any).learningObjectives || [],
            totalModules: c.totalModules ?? (c.modules?.length ?? 0),
            totalLessons: c.totalLessons ?? 0,
            isPublished: c.isPublished ?? false,
          });
        } else {
          setFetchError('Failed to load course');
        }
      } catch {
        setFetchError('Failed to load course data');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [courseId, form]);

  const tags = form.watch('tags') || [];
  const prerequisites = form.watch('prerequisites') || [];

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      form.setValue('tags', [...tags, val]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    form.setValue('tags', tags.filter((t) => t !== tag));
  };

  const addPrereq = () => {
    const val = prereqInput.trim();
    if (val && !prerequisites.includes(val)) {
      form.setValue('prerequisites', [...prerequisites, val]);
      setPrereqInput('');
    }
  };

  const removePrereq = (item: string) => {
    form.setValue('prerequisites', prerequisites.filter((p) => p !== item));
  };

  const [modules, setModules] = React.useState<any[]>(course?.modules || []);
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = React.useState(false);
  const [editingModule, setEditingModule] = React.useState<any>(null);
  const [editingLesson, setEditingLesson] = React.useState<any>(null);
  const [activeModuleId, setActiveModuleId] = React.useState<string | null>(null);
  const [moduleFormTitle, setModuleFormTitle] = React.useState('');
  const [moduleFormDesc, setModuleFormDesc] = React.useState('');
  const [lessonFormTitle, setLessonFormTitle] = React.useState('');
  const [lessonFormDesc, setLessonFormDesc] = React.useState('');
  const [lessonFormVideo, setLessonFormVideo] = React.useState('');
  const [lessonFormDuration, setLessonFormDuration] = React.useState('');
  const [lessonFormIsFree, setLessonFormIsFree] = React.useState(false);
  const [savingModule, setSavingModule] = React.useState(false);
  const [savingLesson, setSavingLesson] = React.useState(false);

  const [materials, setMaterials] = React.useState<any[]>([]);
  const [materialDialogOpen, setMaterialDialogOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<any>(null);
  const [materialFormTitle, setMaterialFormTitle] = React.useState('');
  const [materialFormDesc, setMaterialFormDesc] = React.useState('');
  const [materialFormUrl, setMaterialFormUrl] = React.useState('');
  const [materialFormType, setMaterialFormType] = React.useState('pdf');
  const [materialFormModuleId, setMaterialFormModuleId] = React.useState('');
  const [savingMaterial, setSavingMaterial] = React.useState(false);

  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = React.useState(false);
  const [editingAssignment, setEditingAssignment] = React.useState<any>(null);
  const [assignmentFormTitle, setAssignmentFormTitle] = React.useState('');
  const [assignmentFormDesc, setAssignmentFormDesc] = React.useState('');
  const [assignmentFormDueDate, setAssignmentFormDueDate] = React.useState('');
  const [assignmentFormMaxScore, setAssignmentFormMaxScore] = React.useState('100');
  const [assignmentFormPassingScore, setAssignmentFormPassingScore] = React.useState('40');
  const [assignmentFormFileUrl, setAssignmentFormFileUrl] = React.useState('');
  const [savingAssignment, setSavingAssignment] = React.useState(false);

  // MCQ Assessment state
  const [mcqTests, setMcqTests] = React.useState<any[]>([]);
  const [mcqDialogOpen, setMcqDialogOpen] = React.useState(false);
  const [editingMcq, setEditingMcq] = React.useState<any>(null);
  const [mcqFormTitle, setMcqFormTitle] = React.useState('');
  const [mcqFormDesc, setMcqFormDesc] = React.useState('');
  const [mcqFormDuration, setMcqFormDuration] = React.useState('30');
  const [mcqFormPassingScore, setMcqFormPassingScore] = React.useState('40');
  const [savingMcq, setSavingMcq] = React.useState(false);

  // MCQ Question management state
  const [questionDialogOpen, setQuestionDialogOpen] = React.useState(false);
  const [activeMcqForQuestions, setActiveMcqForQuestions] = React.useState<any>(null);
  const [editingQuestion, setEditingQuestion] = React.useState<any>(null);
  const [questionFormText, setQuestionFormText] = React.useState('');
  const [questionFormPoints, setQuestionFormPoints] = React.useState('1');
  const [questionFormType, setQuestionFormType] = React.useState<'single' | 'multiple'>('single');
  const [questionFormOptions, setQuestionFormOptions] = React.useState<Array<{ text: string; isCorrect: boolean }>>([]);
  const [savingQuestion, setSavingQuestion] = React.useState(false);

  // Coding Assessment state
  const [codingAssessments, setCodingAssessments] = React.useState<any[]>([]);
  const [codingDialogOpen, setCodingDialogOpen] = React.useState(false);
  const [editingCoding, setEditingCoding] = React.useState<any>(null);
  const [codingFormTitle, setCodingFormTitle] = React.useState('');
  const [codingFormDesc, setCodingFormDesc] = React.useState('');
  const [codingFormDuration, setCodingFormDuration] = React.useState('60');
  const [codingFormLanguage, setCodingFormLanguage] = React.useState('javascript');
  const [codingFormProblem, setCodingFormProblem] = React.useState('');
  const [codingFormTestCases, setCodingFormTestCases] = React.useState('');
  const [codingFormPassingScore, setCodingFormPassingScore] = React.useState('50');
  const [savingCoding, setSavingCoding] = React.useState(false);

  const normalizeModules = (data: any[]) =>
    data.map((mod: any) => ({
      ...mod,
      _id: mod._id || mod.id,
      lessons: (mod.lessons || []).map((lesson: any) => ({
        ...lesson,
        _id: lesson._id || lesson.id,
      })),
    }));

  const refreshModules = React.useCallback(async () => {
    try {
      const res = await courseService.getModules(courseId);
      const data = res.data.data;
      setModules(Array.isArray(data) ? normalizeModules(data) : []);
    } catch {
      // silent
    }
  }, [courseId]);

  React.useEffect(() => {
    if (course?.modules) {
      setModules(normalizeModules(course.modules));
    }
  }, [course]);

  const openAddModule = () => {
    setEditingModule(null);
    setModuleFormTitle('');
    setModuleFormDesc('');
    setModuleDialogOpen(true);
  };

  const openEditModule = (mod: any) => {
    setEditingModule(mod);
    setModuleFormTitle(mod.title || '');
    setModuleFormDesc(mod.description || '');
    setModuleDialogOpen(true);
  };

  const saveModule = async () => {
    if (!moduleFormTitle.trim()) { toast.error('Module title is required'); return; }
    try {
      setSavingModule(true);
      if (editingModule) {
        await courseService.updateModule(courseId, editingModule._id, { title: moduleFormTitle.trim(), description: moduleFormDesc.trim() || undefined });
        toast.success('Module updated');
      } else {
        await courseService.addModule(courseId, { title: moduleFormTitle.trim(), description: moduleFormDesc.trim() || undefined });
        toast.success('Module added');
      }
      setModuleDialogOpen(false);
      await refreshModules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save module');
    } finally {
      setSavingModule(false);
    }
  };

  const deleteModule = async (modId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    try {
      await courseService.deleteModule(courseId, modId);
      toast.success('Module deleted');
      await refreshModules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete module');
    }
  };

  const openAddLesson = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setEditingLesson(null);
    setLessonFormTitle('');
    setLessonFormDesc('');
    setLessonFormVideo('');
    setLessonFormDuration('');
    setLessonFormIsFree(false);
    setLessonDialogOpen(true);
  };

  const openEditLesson = (moduleId: string, lesson: any) => {
    setActiveModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonFormTitle(lesson.title || '');
    setLessonFormDesc(lesson.description || '');
    setLessonFormVideo(lesson.videoUrl || '');
    setLessonFormDuration(String(lesson.duration ?? ''));
    setLessonFormIsFree(lesson.isFree || false);
    setLessonDialogOpen(true);
  };

  const saveLesson = async () => {
    if (!lessonFormTitle.trim()) { toast.error('Lesson title is required'); return; }
    if (!activeModuleId) return;
    try {
      setSavingLesson(true);
      const payload: Record<string, unknown> = {
        title: lessonFormTitle.trim(),
        description: lessonFormDesc.trim() || undefined,
        videoUrl: lessonFormVideo.trim() || undefined,
        duration: lessonFormDuration ? Number(lessonFormDuration) : undefined,
        isFree: lessonFormIsFree,
      };
      if (editingLesson) {
        await courseService.updateLesson(courseId, activeModuleId, editingLesson._id, payload);
        toast.success('Lesson updated');
      } else {
        await courseService.addLesson(courseId, activeModuleId, payload);
        toast.success('Lesson added');
      }
      setLessonDialogOpen(false);
      await refreshModules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save lesson');
    } finally {
      setSavingLesson(false);
    }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await courseService.deleteLesson(courseId, moduleId, lessonId);
      toast.success('Lesson deleted');
      await refreshModules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete lesson');
    }
  };

  const refreshMaterials = React.useCallback(async () => {
    try {
      const res = await courseService.getStudyMaterials(courseId);
      const data = res.data.data;
      setMaterials(Array.isArray(data) ? data : []);
    } catch {
      // silent
    }
  }, [courseId]);

  React.useEffect(() => {
    refreshMaterials();
  }, [refreshMaterials]);

  const openAddMaterial = () => {
    setEditingMaterial(null);
    setMaterialFormTitle('');
    setMaterialFormDesc('');
    setMaterialFormUrl('');
    setMaterialFormType('pdf');
    setMaterialFormModuleId('');
    setMaterialDialogOpen(true);
  };

  const openEditMaterial = (mat: any) => {
    setEditingMaterial(mat);
    setMaterialFormTitle(mat.title || '');
    setMaterialFormDesc(mat.description || '');
    setMaterialFormUrl(mat.fileUrl || '');
    setMaterialFormType(mat.fileType || 'pdf');
    setMaterialFormModuleId(mat.moduleId || '');
    setMaterialDialogOpen(true);
  };

  const saveMaterial = async () => {
    if (!materialFormTitle.trim()) { toast.error('Material title is required'); return; }
    if (!materialFormUrl.trim()) { toast.error('File URL is required'); return; }
    try {
      setSavingMaterial(true);
      const payload: Record<string, unknown> = {
        title: materialFormTitle.trim(),
        description: materialFormDesc.trim() || undefined,
        fileUrl: materialFormUrl.trim(),
        fileType: materialFormType,
        moduleId: materialFormModuleId || undefined,
      };
      if (editingMaterial) {
        await courseService.updateStudyMaterial(courseId, editingMaterial._id, payload);
        toast.success('Material updated');
      } else {
        await courseService.addStudyMaterial(courseId, payload as any);
        toast.success('Material added');
      }
      setMaterialDialogOpen(false);
      await refreshMaterials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save material');
    } finally {
      setSavingMaterial(false);
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await courseService.deleteStudyMaterial(courseId, materialId);
      toast.success('Material deleted');
      await refreshMaterials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete material');
    }
  };

  const refreshAssignments = React.useCallback(async () => {
    try {
      const res = await courseService.getAssignments(courseId);
      const data = res.data.data;
      setAssignments(Array.isArray(data) ? data : []);
    } catch {
      // silent
    }
  }, [courseId]);

  React.useEffect(() => {
    refreshAssignments();
  }, [refreshAssignments]);

  const openAddAssignment = () => {
    setEditingAssignment(null);
    setAssignmentFormTitle('');
    setAssignmentFormDesc('');
    setAssignmentFormDueDate('');
    setAssignmentFormMaxScore('100');
    setAssignmentFormPassingScore('40');
    setAssignmentFormFileUrl('');
    setAssignmentDialogOpen(true);
  };

  const openEditAssignment = (a: any) => {
    setEditingAssignment(a);
    setAssignmentFormTitle(a.title || '');
    setAssignmentFormDesc(a.description || '');
    setAssignmentFormDueDate(a.dueDate ? a.dueDate.slice(0, 10) : '');
    setAssignmentFormMaxScore(String(a.maxScore ?? 100));
    setAssignmentFormPassingScore(String(a.passingScore ?? 40));
    setAssignmentFormFileUrl(a.fileUrl || '');
    setAssignmentDialogOpen(true);
  };

  const saveAssignment = async () => {
    if (!assignmentFormTitle.trim()) { toast.error('Assignment title is required'); return; }
    try {
      setSavingAssignment(true);
      const payload: Record<string, unknown> = {
        title: assignmentFormTitle.trim(),
        description: assignmentFormDesc.trim() || undefined,
        dueDate: assignmentFormDueDate || undefined,
        maxScore: Number(assignmentFormMaxScore) || 100,
        passingScore: Number(assignmentFormPassingScore) || 40,
        fileUrl: assignmentFormFileUrl.trim() || undefined,
      };
      if (editingAssignment) {
        await courseService.updateAssignment(courseId, editingAssignment._id || editingAssignment.id, payload);
        toast.success('Assignment updated');
      } else {
        await courseService.addAssignment(courseId, payload);
        toast.success('Assignment added');
      }
      setAssignmentDialogOpen(false);
      await refreshAssignments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save assignment');
    } finally {
      setSavingAssignment(false);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await courseService.deleteAssignment(courseId, assignmentId);
      toast.success('Assignment deleted');
      await refreshAssignments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete assignment');
    }
  };

  // ---- MCQ Assessment CRUD ----

  const refreshMcqTests = React.useCallback(async () => {
    try {
      const res = await courseService.getMcqTests(courseId);
      const data = res.data.data;
      setMcqTests(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [courseId]);

  React.useEffect(() => { refreshMcqTests(); }, [refreshMcqTests]);

  const openAddMcq = () => {
    setEditingMcq(null);
    setMcqFormTitle('');
    setMcqFormDesc('');
    setMcqFormDuration('30');
    setMcqFormPassingScore('40');
    setMcqDialogOpen(true);
  };

  const openEditMcq = (t: any) => {
    setEditingMcq(t);
    setMcqFormTitle(t.title || '');
    setMcqFormDesc(t.description || '');
    setMcqFormDuration(String(t.duration ?? 30));
    setMcqFormPassingScore(String(t.passingScore ?? 40));
    setMcqDialogOpen(true);
  };

  const saveMcq = async () => {
    if (!mcqFormTitle.trim()) { toast.error('Title is required'); return; }
    try {
      setSavingMcq(true);
      const payload: Record<string, unknown> = {
        title: mcqFormTitle.trim(),
        description: mcqFormDesc.trim() || undefined,
        duration: Number(mcqFormDuration) || 30,
        passingScore: Number(mcqFormPassingScore) || 40,
      };
      if (editingMcq) {
        await courseService.updateMcqTest(courseId, editingMcq._id || editingMcq.id, payload);
        toast.success('MCQ test updated');
      } else {
        await courseService.addMcqTest(courseId, payload);
        toast.success('MCQ test added');
      }
      setMcqDialogOpen(false);
      await refreshMcqTests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save MCQ test');
    } finally {
      setSavingMcq(false);
    }
  };

  const deleteMcq = async (mcqId: string) => {
    if (!confirm('Delete this MCQ test?')) return;
    try {
      await courseService.deleteMcqTest(courseId, mcqId);
      toast.success('MCQ test deleted');
      await refreshMcqTests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete MCQ test');
    }
  };

  // ---- MCQ Question CRUD ----

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionFormText('');
    setQuestionFormPoints('1');
    setQuestionFormType('single');
    setQuestionFormOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
  };

  const openEditQuestion = (q: any) => {
    setEditingQuestion(q);
    setQuestionFormText(q.text || '');
    setQuestionFormPoints(String(q.marks ?? 1));
    setQuestionFormType(q.questionType || 'single');
    setQuestionFormOptions((q.options || []).map((o: any) => ({ text: o.text, isCorrect: o.isCorrect })));
  };

  const addOptionField = () => {
    setQuestionFormOptions([...questionFormOptions, { text: '', isCorrect: false }]);
  };

  const removeOptionField = (idx: number) => {
    if (questionFormOptions.length <= 2) return;
    setQuestionFormOptions(questionFormOptions.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updated = [...questionFormOptions];
    if (field === 'isCorrect' && questionFormType === 'single') {
      updated.forEach((o, i) => { o.isCorrect = i === idx; });
    } else {
      (updated[idx] as any)[field] = value;
    }
    setQuestionFormOptions(updated);
  };

  const saveQuestion = async () => {
    if (!questionFormText.trim()) { toast.error('Question text is required'); return; }
    const validOptions = questionFormOptions.filter((o) => o.text.trim());
    if (validOptions.length < 2) { toast.error('At least 2 options with text are required'); return; }
    if (!validOptions.some((o) => o.isCorrect)) { toast.error('At least one correct answer is required'); return; }
    if (!activeMcqForQuestions) return;
    try {
      setSavingQuestion(true);
      const payload = {
        questionText: questionFormText.trim(),
        points: Number(questionFormPoints) || 1,
        options: validOptions.map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
      };
      const mcqId = activeMcqForQuestions._id || activeMcqForQuestions.id;
      if (editingQuestion) {
        await courseService.updateMcqQuestion(courseId, mcqId, editingQuestion.id, payload);
        toast.success('Question updated');
      } else {
        await courseService.addMcqQuestion(courseId, mcqId, payload);
        toast.success('Question added');
      }
      setQuestionDialogOpen(false);
      await refreshMcqTests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    if (!activeMcqForQuestions) return;
    try {
      const mcqId = activeMcqForQuestions._id || activeMcqForQuestions.id;
      await courseService.deleteMcqQuestion(courseId, mcqId, questionId);
      toast.success('Question deleted');
      await refreshMcqTests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  // ---- Coding Assessment CRUD ----

  const refreshCodingAssessments = React.useCallback(async () => {
    try {
      const res = await courseService.getCodingAssessments(courseId);
      const data = res.data.data;
      setCodingAssessments(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [courseId]);

  React.useEffect(() => { refreshCodingAssessments(); }, [refreshCodingAssessments]);

  const openAddCoding = () => {
    setEditingCoding(null);
    setCodingFormTitle('');
    setCodingFormDesc('');
    setCodingFormDuration('60');
    setCodingFormLanguage('javascript');
    setCodingFormProblem('');
    setCodingFormTestCases('');
    setCodingFormPassingScore('50');
    setCodingDialogOpen(true);
  };

  const openEditCoding = (a: any) => {
    setEditingCoding(a);
    setCodingFormTitle(a.title || '');
    setCodingFormDesc(a.description || '');
    setCodingFormDuration(String(a.duration ?? 60));
    setCodingFormLanguage(a.language || 'javascript');
    setCodingFormProblem(a.problemStatement || '');
    setCodingFormTestCases(a.testCases || '');
    setCodingFormPassingScore(String(a.passingScore ?? 50));
    setCodingDialogOpen(true);
  };

  const saveCoding = async () => {
    if (!codingFormTitle.trim()) { toast.error('Title is required'); return; }
    if (!codingFormProblem.trim()) { toast.error('Problem statement is required'); return; }
    try {
      setSavingCoding(true);
      const payload: Record<string, unknown> = {
        title: codingFormTitle.trim(),
        description: codingFormDesc.trim() || undefined,
        duration: Number(codingFormDuration) || 60,
        language: codingFormLanguage,
        problemStatement: codingFormProblem.trim(),
        testCases: codingFormTestCases || '[]',
        passingScore: Number(codingFormPassingScore) || 50,
      };
      if (editingCoding) {
        await courseService.updateCodingAssessment(courseId, editingCoding._id || editingCoding.id, payload);
        toast.success('Coding assessment updated');
      } else {
        await courseService.addCodingAssessment(courseId, payload);
        toast.success('Coding assessment added');
      }
      setCodingDialogOpen(false);
      await refreshCodingAssessments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save coding assessment');
    } finally {
      setSavingCoding(false);
    }
  };

  const deleteCoding = async (codingId: string) => {
    if (!confirm('Delete this coding assessment?')) return;
    try {
      await courseService.deleteCodingAssessment(courseId, codingId);
      toast.success('Coding assessment deleted');
      await refreshCodingAssessments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete coding assessment');
    }
  };

  const onSubmit = async (values: EditCourseFormValues) => {
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        ...values,
        trainerId: values.trainerId || (user as any)?.id || (user as any)?._id,
        collegeId: values.collegeId || undefined,
        shortDescription: values.shortDescription || undefined,
        thumbnail: values.thumbnail || undefined,
        tags: values.tags?.length ? values.tags : undefined,
        prerequisites: values.prerequisites?.length ? values.prerequisites : undefined,
        learningObjectives: values.learningObjectives?.length ? values.learningObjectives : undefined,
        totalModules: Number(values.totalModules) || 0,
        totalLessons: Number(values.totalLessons) || 0,
      };
      await courseService.update(courseId, payload as Record<string, unknown>);
      toast.success('Course updated successfully');
      router.push(`/courses/${courseId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading course..." />
      </div>
    );
  }

  if (fetchError) {
    return <ErrorState message={fetchError} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/courses/${courseId}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Course</h1>
            <p className="text-sm text-muted-foreground">Update the course details</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
              <CardDescription>Course title, description, and category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </SelectItem>
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
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief summary (max 300 chars)" className="resize-none" rows={2} {...field} />
                    </FormControl>
                    <FormDescription>Displayed in course cards</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed course description" className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder="e.g. 40" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" placeholder="0 for free" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Optional URL for course thumbnail image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Tags, Prerequisites, Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags & Prerequisites</CardTitle>
              <CardDescription>Add tags and prerequisites for the course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a tag and press Add"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addTag} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <FormLabel>Prerequisites</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {prerequisites.map((pr) => (
                    <Badge key={pr} variant="secondary" className="gap-1">
                      {pr}
                      <button type="button" onClick={() => removePrereq(pr)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a prerequisite and press Add"
                    value={prereqInput}
                    onChange={(e) => setPrereqInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPrereq(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addPrereq} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Structure & Publishing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Structure & Publishing</CardTitle>
              <CardDescription>Course structure counts and publish status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="totalModules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Modules</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="e.g. 8" {...field} />
                      </FormControl>
                      <FormDescription>Number of modules in this course</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalLessons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Lessons</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="e.g. 40" {...field} />
                      </FormControl>
                      <FormDescription>Number of lessons across all modules</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Published</FormLabel>
                      <FormDescription>
                        {field.value ? 'Course is visible to students' : 'Course is hidden as draft'}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
              <CardDescription>College and trainer assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="collegeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colleges
                            .filter((c: any) => c.isActive !== false)
                            .map((college: any) => (
                              <SelectItem key={college.id || college._id} value={college.id || college._id}>
                                {college.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Optional. Leave blank for no college</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trainerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trainer</FormLabel>
                      {canManageAll ? (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a trainer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {trainers.map((t: any) => {
                              const tid = t.id || t._id;
                              const tName = t.firstName && t.lastName
                                ? `${t.firstName} ${t.lastName}`
                                : t.name || t.email || tid;
                              return (
                                <SelectItem key={tid} value={tid}>
                                  {tName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">
                          You are assigned as the trainer for this course
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Curriculum - Module & Lesson Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Curriculum</CardTitle>
                <CardDescription>Organize your course into modules and lessons</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={openAddModule}>
                <Plus className="mr-1 h-4 w-4" />
                Add Module
              </Button>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <Layers className="mb-4 h-10 w-10 text-muted-foreground/60" />
                  <h3 className="mb-1 text-sm font-semibold">No modules yet</h3>
                  <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                    Start building your curriculum by adding your first module
                  </p>
                  <Button type="button" size="sm" onClick={openAddModule}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Module
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((mod, modIdx) => (
                    <details key={mod._id} className="group rounded-lg border" open={modules.length <= 3}>
                      <summary className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
                        <div className="flex items-center gap-2 text-left min-w-0">
                          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                          <span className="font-medium truncate">{mod.title}</span>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {(mod.lessons?.length || 0)} {(mod.lessons?.length || 0) === 1 ? 'lesson' : 'lessons'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModule(mod)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteModule(mod._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                        </div>
                      </summary>
                      {mod.description && (
                        <div className="px-3 pb-2">
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </div>
                      )}
                      <Separator />
                      <div className="p-3 space-y-2">
                        {mod.lessons && mod.lessons.length > 0 ? (
                          mod.lessons.map((lesson: any) => (
                            <div key={lesson._id} className="flex items-center justify-between rounded-lg border p-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                {lesson.videoUrl ? (
                                  <Video className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{lesson.title}</p>
                                  {lesson.description && (
                                    <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {lesson.duration && (
                                  <span className="text-xs text-muted-foreground mr-1">{lesson.duration}min</span>
                                )}
                                {lesson.isFree && (
                                  <Badge variant="outline" className="text-[10px] h-5">Free</Badge>
                                )}
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLesson(mod._id, lesson)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteLesson(mod._id, lesson._id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground py-1">No lessons yet</p>
                        )}
                        <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => openAddLesson(mod._id)}>
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add Lesson
                        </Button>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Study Materials */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Study Materials</CardTitle>
                <CardDescription>Upload and manage course materials</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={openAddMaterial}>
                <Plus className="mr-1 h-4 w-4" />
                Add Material
              </Button>
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <FileText className="mb-4 h-10 w-10 text-muted-foreground/60" />
                  <h3 className="mb-1 text-sm font-semibold">No materials yet</h3>
                  <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                    Add study materials like PDFs, documents, or links
                  </p>
                  <Button type="button" size="sm" onClick={openAddMaterial}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Material
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {materials.map((mat) => (
                    <div key={mat._id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{mat.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{mat.fileType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMaterial(mat)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMaterial(mat._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Assignments</CardTitle>
                <CardDescription>Create and manage course assignments</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={openAddAssignment}>
                <Plus className="mr-1 h-4 w-4" />
                Add Assignment
              </Button>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <FileText className="mb-4 h-10 w-10 text-muted-foreground/60" />
                  <h3 className="mb-1 text-sm font-semibold">No assignments yet</h3>
                  <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                    Create assignments with due dates and scoring
                  </p>
                  <Button type="button" size="sm" onClick={openAddAssignment}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Assignment
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div key={a._id || a.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Max: {a.maxScore} | Passing: {a.passingScore}
                            {a.dueDate ? ` | Due: ${new Date(a.dueDate).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditAssignment(a)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteAssignment(a._id || a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* MCQ Assessments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">MCQ Tests</CardTitle>
                <CardDescription>Create and manage MCQ assessments</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={openAddMcq}>
                <Plus className="mr-1 h-4 w-4" />
                Add MCQ Test
              </Button>
            </CardHeader>
            <CardContent>
              {mcqTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <BookOpen className="mb-4 h-10 w-10 text-muted-foreground/60" />
                  <h3 className="mb-1 text-sm font-semibold">No MCQ tests yet</h3>
                  <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                    Create MCQ tests with duration and passing score
                  </p>
                  <Button type="button" size="sm" onClick={openAddMcq}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add MCQ Test
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {mcqTests.map((t) => (
                    <div key={t._id || t.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Duration: {t.duration}min | Passing: {t.passingScore}% | Questions: {t.totalQuestions ?? t.questions?.length ?? 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setActiveMcqForQuestions(t); openAddQuestion(); setQuestionDialogOpen(true); }}>
                          Questions
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMcq(t)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMcq(t._id || t.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coding Assessments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Coding Assessments</CardTitle>
                <CardDescription>Create and manage coding challenges</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={openAddCoding}>
                <Plus className="mr-1 h-4 w-4" />
                Add Coding Assessment
              </Button>
            </CardHeader>
            <CardContent>
              {codingAssessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <BookOpen className="mb-4 h-10 w-10 text-muted-foreground/60" />
                  <h3 className="mb-1 text-sm font-semibold">No coding assessments yet</h3>
                  <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                    Create coding challenges with test cases
                  </p>
                  <Button type="button" size="sm" onClick={openAddCoding}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Coding Assessment
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {codingAssessments.map((a) => (
                    <div key={a._id || a.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.language} | Duration: {a.duration}min | Passing: {a.passingScore}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCoding(a)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteCoding(a._id || a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Module Dialog */}
          <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
                <DialogDescription>
                  {editingModule ? 'Update the module details' : 'Create a new module for your course'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Module title"
                    value={moduleFormTitle}
                    onChange={(e) => setModuleFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="Module description"
                    value={moduleFormDesc}
                    onChange={(e) => setModuleFormDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={saveModule} disabled={savingModule}>
                  {savingModule ? 'Saving...' : editingModule ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Lesson Dialog */}
          <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
                <DialogDescription>
                  {editingLesson ? 'Update the lesson details' : 'Add a new lesson to this module'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Lesson title"
                    value={lessonFormTitle}
                    onChange={(e) => setLessonFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="Lesson description"
                    value={lessonFormDesc}
                    onChange={(e) => setLessonFormDesc(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video URL (optional)</label>
                    <Input
                      placeholder="https://example.com/video.mp4"
                      value={lessonFormVideo}
                      onChange={(e) => setLessonFormVideo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 15"
                      value={lessonFormDuration}
                      onChange={(e) => setLessonFormDuration(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="lesson-is-free"
                    checked={lessonFormIsFree}
                    onCheckedChange={setLessonFormIsFree}
                  />
                  <label htmlFor="lesson-is-free" className="text-sm">Free lesson (no enrollment required)</label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={saveLesson} disabled={savingLesson}>
                  {savingLesson ? 'Saving...' : editingLesson ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Material Dialog */}
          <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add Material'}</DialogTitle>
                <DialogDescription>
                  {editingMaterial ? 'Update the material details' : 'Add a new study material'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Material title"
                    value={materialFormTitle}
                    onChange={(e) => setMaterialFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="Material description"
                    value={materialFormDesc}
                    onChange={(e) => setMaterialFormDesc(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File URL</label>
                  <Input
                    placeholder="https://example.com/file.pdf"
                    value={materialFormUrl}
                    onChange={(e) => setMaterialFormUrl(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">File Type</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={materialFormType}
                      onChange={(e) => setMaterialFormType(e.target.value)}
                    >
                      <option value="pdf">PDF</option>
                      <option value="video">Video</option>
                      <option value="link">Link</option>
                      <option value="file">File</option>
                      <option value="image">Image</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Module (optional)</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={materialFormModuleId}
                      onChange={(e) => setMaterialFormModuleId(e.target.value)}
                    >
                      <option value="">All modules</option>
                      {modules.map((mod) => {
                        const modId = mod._id || mod.id;
                        return (
                          <option key={modId} value={modId}>{mod.title}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={saveMaterial} disabled={savingMaterial}>
                  {savingMaterial ? 'Saving...' : editingMaterial ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Assignment Dialog */}
          <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
                <DialogDescription>
                  {editingAssignment ? 'Update the assignment details' : 'Create a new assignment'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Assignment title"
                    value={assignmentFormTitle}
                    onChange={(e) => setAssignmentFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Assignment description"
                    value={assignmentFormDesc}
                    onChange={(e) => setAssignmentFormDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={assignmentFormDueDate}
                    onChange={(e) => setAssignmentFormDueDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Score</label>
                    <Input
                      type="number"
                      min={1}
                      value={assignmentFormMaxScore}
                      onChange={(e) => setAssignmentFormMaxScore(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Passing Score</label>
                    <Input
                      type="number"
                      min={1}
                      value={assignmentFormPassingScore}
                      onChange={(e) => setAssignmentFormPassingScore(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File URL (optional)</label>
                  <Input
                    placeholder="https://example.com/assignment.pdf"
                    value={assignmentFormFileUrl}
                    onChange={(e) => setAssignmentFormFileUrl(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={saveAssignment} disabled={savingAssignment}>
                  {savingAssignment ? 'Saving...' : editingAssignment ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* MCQ Test Dialog */}
          <Dialog open={mcqDialogOpen} onOpenChange={setMcqDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMcq ? 'Edit MCQ Test' : 'Add MCQ Test'}</DialogTitle>
                <DialogDescription>
                  {editingMcq ? 'Update the MCQ test details' : 'Create a new MCQ test'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="MCQ test title"
                    value={mcqFormTitle}
                    onChange={(e) => setMcqFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="Test description"
                    value={mcqFormDesc}
                    onChange={(e) => setMcqFormDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={1}
                      value={mcqFormDuration}
                      onChange={(e) => setMcqFormDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Passing Score (%)</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={mcqFormPassingScore}
                      onChange={(e) => setMcqFormPassingScore(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMcqDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={saveMcq} disabled={savingMcq}>
                  {savingMcq ? 'Saving...' : editingMcq ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* MCQ Question Dialog */}
          <Dialog open={questionDialogOpen} onOpenChange={(open) => { if (!open) { setQuestionDialogOpen(false); setActiveMcqForQuestions(null); } }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {activeMcqForQuestions?.title ? `Questions: ${activeMcqForQuestions.title}` : 'Manage Questions'}
                </DialogTitle>
                <DialogDescription>
                  Add, edit or remove questions and options for this MCQ test
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {/* Existing questions */}
                {activeMcqForQuestions && (activeMcqForQuestions.questions || []).length > 0 && (
                  <div className="space-y-3">
                    {(activeMcqForQuestions.questions || []).map((q: any, qi: number) => (
                      <div key={q.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {qi + 1}. {q.text}
                            </p>
                            <p className="text-xs text-muted-foreground">Marks: {q.marks}</p>
                            <ul className="mt-1 space-y-0.5">
                              {(q.options || []).map((o: any, oi: number) => (
                                <li key={oi} className={`text-xs ${o.isCorrect ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                  {o.isCorrect ? '✓ ' : ''}{o.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditQuestion(q)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteQuestion(q.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(!activeMcqForQuestions || !(activeMcqForQuestions.questions || []).length) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No questions yet. Add one below.</p>
                )}
                <Separator />
                {/* Add/Edit question form */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Question Text</label>
                    <Textarea
                      placeholder="Enter the question"
                      value={questionFormText}
                      onChange={(e) => setQuestionFormText(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Points</label>
                      <Input
                        type="number"
                        min={1}
                        value={questionFormPoints}
                        onChange={(e) => setQuestionFormPoints(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={questionFormType}
                        onChange={(e) => {
                          const newType = e.target.value as 'single' | 'multiple';
                          setQuestionFormType(newType);
                          if (newType === 'single') {
                            const hasCorrect = questionFormOptions.some((o) => o.isCorrect);
                            if (hasCorrect) {
                              const firstCorrect = questionFormOptions.findIndex((o) => o.isCorrect);
                              setQuestionFormOptions(questionFormOptions.map((o, i) => ({ ...o, isCorrect: i === firstCorrect })));
                            }
                          }
                        }}
                      >
                        <option value="single">Single Choice</option>
                        <option value="multiple">Multiple Choice</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Options</label>
                      <Button type="button" variant="outline" size="sm" onClick={addOptionField}>
                        <Plus className="mr-1 h-3 w-3" />Add Option
                      </Button>
                    </div>
                    {questionFormOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${opt.isCorrect ? 'bg-green-600 border-green-600 text-white' : 'border-input'}`}
                          onClick={() => updateOption(idx, 'isCorrect', !opt.isCorrect)}
                        >
                          {opt.isCorrect && '✓'}
                        </button>
                        <Input
                          placeholder={`Option ${idx + 1}`}
                          value={opt.text}
                          onChange={(e) => updateOption(idx, 'text', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                          disabled={questionFormOptions.length <= 2}
                          onClick={() => removeOptionField(idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setEditingQuestion(null); setQuestionFormText(''); setQuestionFormPoints('1'); setQuestionFormOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]); }}>
                      Clear
                    </Button>
                    <Button type="button" size="sm" onClick={saveQuestion} disabled={savingQuestion}>
                      {savingQuestion ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setQuestionDialogOpen(false); setActiveMcqForQuestions(null); }}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Coding Assessment Dialog */}
          <Dialog open={codingDialogOpen} onOpenChange={setCodingDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCoding ? 'Edit Coding Assessment' : 'Add Coding Assessment'}</DialogTitle>
                <DialogDescription>
                  {editingCoding ? 'Update the coding assessment details' : 'Create a new coding assessment'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Coding assessment title"
                    value={codingFormTitle}
                    onChange={(e) => setCodingFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="Assessment description"
                    value={codingFormDesc}
                    onChange={(e) => setCodingFormDesc(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Problem Statement</label>
                  <Textarea
                    placeholder="Describe the coding problem..."
                    value={codingFormProblem}
                    onChange={(e) => setCodingFormProblem(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Cases (JSON)</label>
                  <Textarea
                    placeholder='[{"input": "5", "expected": "25"}]'
                    value={codingFormTestCases}
                    onChange={(e) => setCodingFormTestCases(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={1}
                      value={codingFormDuration}
                      onChange={(e) => setCodingFormDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={codingFormLanguage}
                      onChange={(e) => setCodingFormLanguage(e.target.value)}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="csharp">C#</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="typescript">TypeScript</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Passing Score (%)</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={codingFormPassingScore}
                      onChange={(e) => setCodingFormPassingScore(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCodingDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={saveCoding} disabled={savingCoding}>
                  {savingCoding ? 'Saving...' : editingCoding ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" asChild>
              <Link href={`/courses/${courseId}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
