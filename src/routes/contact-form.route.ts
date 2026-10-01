import { sendContactFormController } from '@controllers';
import { middlewares } from '@middlewares';
import { catchError } from '@utils';
import { Router } from 'express';

export const contactFormRouter = Router();

contactFormRouter.post('/contact-form', middlewares.logoUpload, catchError(sendContactFormController));
