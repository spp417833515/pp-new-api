import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty) => DOMPurify.sanitize(dirty);
