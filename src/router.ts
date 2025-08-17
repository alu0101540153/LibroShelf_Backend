// router.ts
import { Router } from 'express';
import userRouter from './router/usersRouter';
import userBookRouter from './router/userBooksRouter';
import authRouter from './router/authRouter';

const router = Router();

// specific routes
router.use('/api/users', userRouter);
router.use('/api/users', authRouter);
router.use('/api/user-books', userBookRouter);

export default router;
