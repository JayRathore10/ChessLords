import { Router } from 'express';
import { getFriendsData, sendFriendRequest, respondToRequest } from '../controllers/friend.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', getFriendsData);
router.post('/request', sendFriendRequest);
router.post('/respond', respondToRequest);

export default router;