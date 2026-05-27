import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';

const router = Router();

router.post('/recommend', aiController.recommend);
router.post('/chat', aiController.chat);

export default router;
