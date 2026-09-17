// nodemailer (disabled): import { createContactFormEntryController, sendContactFormController } from '@controllers';
import { createContactFormEntryController } from '@controllers';
import { middlewares } from '@middlewares';
import { catchError } from '@utils';
import { Router } from 'express';

export const contactFormRouter = Router();

contactFormRouter.post('/contact-form', middlewares.logoUpload, catchError(createContactFormEntryController));

// nodemailer (disabled)
// contactFormRouter.post('/contact-form/email', middlewares.emailLogoUpload, catchError(sendContactFormController));
