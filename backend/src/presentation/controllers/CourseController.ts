import { Request, Response, NextFunction } from 'express';
import { container } from '@config/container';
import { CreateCourseUseCase } from '@application/usecases/course/create-course.usecase';
import { UpdateCourseUseCase } from '@application/usecases/course/update-course.usecase';
import { GetCourseUseCase } from '@application/usecases/course/get-course.usecase';
import { ListCoursesUseCase } from '@application/usecases/course/list-courses.usecase';
import { PublishCourseUseCase } from '@application/usecases/course/publish-course.usecase';
import { AppError } from '@shared/errors/AppError';

export class CourseController {
  constructor(
    private createCourseUseCase: CreateCourseUseCase,
    private updateCourseUseCase: UpdateCourseUseCase,
    private getCourseUseCase: GetCourseUseCase,
    private listCoursesUseCase: ListCoursesUseCase,
    private publishCourseUseCase: PublishCourseUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.body.trainerId || (req.user as any).userId;
      const trainer = await container.prisma.trainer.findUnique({ where: { userId } });
      if (!trainer) {
        throw new AppError('Trainer profile not found for this user', 400);
      }
      const body = {
        ...req.body,
        trainerId: trainer.id,
      };
      const result = await this.createCourseUseCase.execute(body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.updateCourseUseCase.execute(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getCourseUseCase.execute(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listCoursesUseCase.execute(req.query as never);
      res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const publish = req.body.publish !== false;
      const result = await this.publishCourseUseCase.execute(req.params.id as string, publish);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getModules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const modules = await container.repositories.courseRepository.getModules(req.params.id as string);
      res.status(200).json({ success: true, data: modules });
    } catch (error) {
      next(error);
    }
  };

  addModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await container.repositories.courseRepository.addModule(req.params.id as string, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await container.repositories.courseRepository.updateModule(req.params.id as string, req.params.moduleId as string, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await container.repositories.courseRepository.deleteModule(req.params.id as string, req.params.moduleId as string);
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };

  addLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await container.repositories.courseRepository.addLesson(req.params.id as string, req.params.moduleId as string, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await container.repositories.courseRepository.updateLesson(req.params.id as string, req.params.moduleId as string, req.params.lessonId as string, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await container.repositories.courseRepository.deleteLesson(req.params.id as string, req.params.moduleId as string, req.params.lessonId as string);
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };

  getStudyMaterials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const materials = await container.repositories.courseRepository.getStudyMaterials(req.params.id as string);
      res.status(200).json({ success: true, data: materials });
    } catch (error) {
      next(error);
    }
  };

  addStudyMaterial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId || req.body.uploadedBy;
      const payload = {
        title: req.body.title,
        description: req.body.description,
        fileUrl: req.body.fileUrl,
        fileType: req.body.fileType,
        fileSize: req.body.fileSize,
        moduleId: req.body.moduleId || null,
        uploadedBy: userId,
      };
      const result = await container.repositories.courseRepository.addStudyMaterial(req.params.id as string, payload);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateStudyMaterial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await container.repositories.courseRepository.updateStudyMaterial(req.params.materialId as string, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteStudyMaterial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await container.repositories.courseRepository.deleteStudyMaterial(req.params.materialId as string);
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };

  getAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignments = await container.prisma.assignment.findMany({
        where: { courseId: req.params.id as string },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: assignments.map(a => ({ ...a, _id: a.id })) });
    } catch (error) {
      next(error);
    }
  };

  addAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId || req.body.uploadedBy;
      const trainer = await container.prisma.trainer.findUnique({ where: { userId } });
      const trainerId = trainer?.id || req.body.trainerId;
      if (!trainerId) throw new AppError('Trainer profile not found', 400);
      const assignment = await container.prisma.assignment.create({
        data: {
          title: req.body.title,
          description: req.body.description,
          dueDate: new Date(req.body.dueDate),
          maxScore: req.body.maxScore ?? 100,
          passingScore: req.body.passingScore ?? 40,
          fileUrl: req.body.fileUrl,
          course: { connect: { id: req.params.id as string } },
          trainer: { connect: { id: trainerId } },
        },
      });
      res.status(201).json({ success: true, data: { ...assignment, _id: assignment.id } });
    } catch (error) {
      next(error);
    }
  };

  updateAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: Record<string, unknown> = {};
      if (req.body.title !== undefined) data.title = req.body.title;
      if (req.body.description !== undefined) data.description = req.body.description;
      if (req.body.dueDate !== undefined) data.dueDate = new Date(req.body.dueDate);
      if (req.body.maxScore !== undefined) data.maxScore = req.body.maxScore;
      if (req.body.passingScore !== undefined) data.passingScore = req.body.passingScore;
      if (req.body.fileUrl !== undefined) data.fileUrl = req.body.fileUrl;
      const assignment = await container.prisma.assignment.update({
        where: { id: req.params.assignmentId as string },
        data,
      });
      res.status(200).json({ success: true, data: { ...assignment, _id: assignment.id } });
    } catch (error) {
      next(error);
    }
  };

  deleteAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await container.prisma.assignment.delete({ where: { id: req.params.assignmentId as string } });
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };

  // --- MCQ Assessment endpoints ---

  getMcqTests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tests = await container.prisma.mCQTest.findMany({
        where: { courseId: req.params.id as string },
        include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: tests.map(t => ({ ...t, _id: t.id })) });
    } catch (error) {
      next(error);
    }
  };

  addMcqTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const questions = req.body.questions as Array<{ questionText: string; questionType?: string; points?: number; explanation?: string; options: Array<{ text: string; isCorrect: boolean }> }> | undefined;
      const test = await container.prisma.mCQTest.create({
        data: {
          title: req.body.title,
          description: req.body.description,
          duration: req.body.duration ?? 30,
          passingScore: req.body.passingScore ?? 40,
          totalQuestions: questions?.length ?? (req.body.totalQuestions ?? 0),
          scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
          course: { connect: { id: req.params.id as string } },
          ...(questions?.length ? {
            questions: {
              create: questions.map((q, idx) => ({
                text: q.questionText,
                marks: q.points ?? 1,
                order: idx + 1,
                options: {
                  create: q.options.map((o) => ({
                    text: o.text,
                    isCorrect: o.isCorrect ?? false,
                  })),
                },
              })),
            },
          } : {}),
        },
        include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
      });
      res.status(201).json({ success: true, data: { ...test, _id: test.id } });
    } catch (error) {
      next(error);
    }
  };

  updateMcqTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: Record<string, unknown> = {};
      if (req.body.title !== undefined) data.title = req.body.title;
      if (req.body.description !== undefined) data.description = req.body.description;
      if (req.body.duration !== undefined) data.duration = req.body.duration;
      if (req.body.passingScore !== undefined) data.passingScore = req.body.passingScore;
      if (req.body.totalQuestions !== undefined) data.totalQuestions = req.body.totalQuestions;
      if (req.body.scheduledAt !== undefined) data.scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
      const questions = req.body.questions as Array<{ questionText: string; questionType?: string; points?: number; explanation?: string; options: Array<{ text: string; isCorrect: boolean }> }> | undefined;
      if (questions) {
        data.totalQuestions = questions.length;
      }
      const test = await container.prisma.mCQTest.update({
        where: { id: req.params.mcqId as string },
        data,
      });
      if (questions) {
        await container.prisma.mCQQuestion.deleteMany({ where: { testId: req.params.mcqId as string } });
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await container.prisma.mCQQuestion.create({
            data: {
              text: q.questionText,
              marks: q.points ?? 1,
              order: i + 1,
              testId: req.params.mcqId as string,
              options: {
                create: q.options.map((o) => ({
                  text: o.text,
                  isCorrect: o.isCorrect ?? false,
                })),
              },
            },
          });
        }
      }
      const updated = await container.prisma.mCQTest.findUnique({
        where: { id: req.params.mcqId as string },
        include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
      });
      res.status(200).json({ success: true, data: { ...updated, _id: updated!.id } });
    } catch (error) {
      next(error);
    }
  };

  deleteMcqTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await container.prisma.mCQTest.delete({ where: { id: req.params.mcqId as string } });
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };

  addMcqQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mcqId = req.params.mcqId as string;
      const courseId = req.params.id as string;
      const { questionText, questionType, points, explanation, options } = req.body;
      const lastQuestion = await container.prisma.mCQQuestion.findFirst({
        where: { testId: mcqId },
        orderBy: { order: 'desc' },
      });
      const question = await container.prisma.mCQQuestion.create({
        data: {
          text: questionText,
          marks: points ?? 1,
          order: (lastQuestion?.order ?? 0) + 1,
          testId: mcqId,
          options: {
            create: (options as Array<{ text: string; isCorrect: boolean }>).map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect ?? false,
            })),
          },
        },
        include: { options: true },
      });
      await container.prisma.mCQTest.update({
        where: { id: mcqId },
        data: { totalQuestions: { increment: 1 } },
      });
      res.status(201).json({ success: true, data: { ...question, _id: question.id } });
    } catch (error) {
      next(error);
    }
  };

  updateMcqQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mcqId = req.params.mcqId as string;
      const questionId = req.params.questionId as string;
      const courseId = req.params.id as string;
      const { questionText, points, explanation, options } = req.body;
      const question = await container.prisma.mCQQuestion.update({
        where: { id: questionId },
        data: {
          text: questionText ?? undefined,
          marks: points ?? undefined,
        },
        include: { options: true },
      });
      if (options) {
        await container.prisma.mCQOption.deleteMany({ where: { questionId } });
        await container.prisma.mCQOption.createMany({
          data: (options as Array<{ text: string; isCorrect: boolean }>).map((o) => ({
            text: o.text,
            isCorrect: o.isCorrect ?? false,
            questionId,
          })),
        });
      }
      const updated = await container.prisma.mCQQuestion.findUnique({
        where: { id: questionId },
        include: { options: true },
      });
      res.status(200).json({ success: true, data: { ...updated, _id: updated!.id } });
    } catch (error) {
      next(error);
    }
  };

  deleteMcqQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mcqId = req.params.mcqId as string;
      const questionId = req.params.questionId as string;
      const courseId = req.params.id as string;
      await container.prisma.mCQQuestion.delete({ where: { id: questionId } });
      await container.prisma.mCQTest.update({
        where: { id: mcqId },
        data: { totalQuestions: { decrement: 1 } },
      });
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };

  // --- Coding Assessment endpoints ---

  getCodingAssessments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assessments = await container.prisma.codingAssessment.findMany({
        where: { courseId: req.params.id as string },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: assessments.map(a => ({ ...a, _id: a.id })) });
    } catch (error) {
      next(error);
    }
  };

  addCodingAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assessment = await container.prisma.codingAssessment.create({
        data: {
          title: req.body.title,
          description: req.body.description,
          duration: req.body.duration ?? 60,
          language: req.body.language ?? 'javascript',
          problemStatement: req.body.problemStatement,
          testCases: req.body.testCases || '[]',
          passingScore: req.body.passingScore ?? 50,
          course: { connect: { id: req.params.id as string } },
        },
      });
      res.status(201).json({ success: true, data: { ...assessment, _id: assessment.id } });
    } catch (error) {
      next(error);
    }
  };

  updateCodingAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: Record<string, unknown> = {};
      if (req.body.title !== undefined) data.title = req.body.title;
      if (req.body.description !== undefined) data.description = req.body.description;
      if (req.body.duration !== undefined) data.duration = req.body.duration;
      if (req.body.language !== undefined) data.language = req.body.language;
      if (req.body.problemStatement !== undefined) data.problemStatement = req.body.problemStatement;
      if (req.body.testCases !== undefined) data.testCases = req.body.testCases;
      if (req.body.passingScore !== undefined) data.passingScore = req.body.passingScore;
      const assessment = await container.prisma.codingAssessment.update({
        where: { id: req.params.codingId as string },
        data,
      });
      res.status(200).json({ success: true, data: { ...assessment, _id: assessment.id } });
    } catch (error) {
      next(error);
    }
  };

  deleteCodingAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await container.prisma.codingAssessment.delete({ where: { id: req.params.codingId as string } });
      res.status(200).json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = [
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
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  };
}
