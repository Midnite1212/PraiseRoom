import {
  createOwnership,
  deleteAccountData,
  deleteOwnership,
  getOwnership,
  listMembers,
  setMemberAccessType,
  updateOwnership,
} from '../controllers/ownership.controllers';
import { createPermissionRouter } from '../policies';

const router = createPermissionRouter();

router.post('/api/ownerships/create', createOwnership);
router.get('/api/ownerships/get', getOwnership);
router.put('/api/ownerships/update', updateOwnership);
router.put('/api/ownerships/delete', deleteOwnership);
router.put('/api/ownerships/delete-account', deleteAccountData);
router.get('/api/ownerships/members', listMembers);
router.put('/api/ownerships/access-type', setMemberAccessType);

export default router.getRouter();
