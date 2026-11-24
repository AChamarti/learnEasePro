import { Router } from 'express';

const router = Router();

// Binary uploads and lesson resource downloads are disabled.
// The course editor stores hosted media URLs in MongoDB instead.
router.all('*', (req, res) => res.status(410).json({
  message: 'File uploads and lesson resource downloads are disabled. Paste a hosted thumbnail or video URL in the course editor.'
}));

export default router;
