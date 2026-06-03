import { Router } from 'express';
import { courseController } from '@presentation/controllers/controllerFactory';
import { authenticate } from '@presentation/middleware/auth.middleware';
import { authorize } from '@presentation/middleware/rbac.middleware';
import { validate } from '@presentation/middleware/validate.middleware';
import { CreateCourseSchema, UpdateCourseSchema } from '@presentation/validators/course.validator';

const router = Router();

router.get('/categories/list', courseController.getCategories);
router.post('/', authenticate, authorize('super_admin', 'college_admin', 'trainer'), validate({ body: CreateCourseSchema }), courseController.create);
router.get('/', courseController.list);
router.get('/:id', courseController.getById);
router.put('/:id', authenticate, authorize('super_admin', 'college_admin', 'trainer'), validate({ body: UpdateCourseSchema }), courseController.update);
router.patch('/:id/publish', authenticate, authorize('super_admin', 'college_admin'), courseController.publish);

// Module routes
router.get('/:id/modules', authenticate, courseController.getModules);
router.post('/:id/modules', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.addModule);
router.put('/:id/modules/:moduleId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.updateModule);
router.delete('/:id/modules/:moduleId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.deleteModule);

// Lesson routes
router.post('/:id/modules/:moduleId/lessons', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.addLesson);
router.put('/:id/modules/:moduleId/lessons/:lessonId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.updateLesson);
router.delete('/:id/modules/:moduleId/lessons/:lessonId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.deleteLesson);

// Study Material routes
router.get('/:id/materials', authenticate, courseController.getStudyMaterials);
router.post('/:id/materials', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.addStudyMaterial);
router.put('/:id/materials/:materialId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.updateStudyMaterial);
router.delete('/:id/materials/:materialId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.deleteStudyMaterial);

// Assignment routes
router.get('/:id/assignments', authenticate, courseController.getAssignments);
router.post('/:id/assignments', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.addAssignment);
router.put('/:id/assignments/:assignmentId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.updateAssignment);
router.delete('/:id/assignments/:assignmentId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.deleteAssignment);

// MCQ Assessment routes
router.get('/:id/assessments/mcq', authenticate, courseController.getMcqTests);
router.post('/:id/assessments/mcq', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.addMcqTest);
router.put('/:id/assessments/mcq/:mcqId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.updateMcqTest);
router.delete('/:id/assessments/mcq/:mcqId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.deleteMcqTest);
router.post('/:id/assessments/mcq/:mcqId/questions', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.addMcqQuestion);
router.put('/:id/assessments/mcq/:mcqId/questions/:questionId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.updateMcqQuestion);
router.delete('/:id/assessments/mcq/:mcqId/questions/:questionId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.deleteMcqQuestion);

// Coding Assessment routes
router.get('/:id/assessments/coding', authenticate, courseController.getCodingAssessments);
router.post('/:id/assessments/coding', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.addCodingAssessment);
router.put('/:id/assessments/coding/:codingId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.updateCodingAssessment);
router.delete('/:id/assessments/coding/:codingId', authenticate, authorize('super_admin', 'college_admin', 'trainer'), courseController.deleteCodingAssessment);

export default router;
