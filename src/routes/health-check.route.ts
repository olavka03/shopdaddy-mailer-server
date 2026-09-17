import { healthCheckController } from '@controllers';
import { catchError } from '@utils';
import { Router } from 'express';

export const healthCheckRouter = Router();

healthCheckRouter.get('/health', catchError(healthCheckController));
