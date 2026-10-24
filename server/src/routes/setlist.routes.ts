import {
  createSetlist,
  deleteSetlist,
  duplicateSetlist,
  getSetlist,
  updateSetlist,
} from '../controllers/setlist.controllers';
import { createPermissionRouter } from '../policies';

const router = createPermissionRouter();

router.post('/api/setlists/create', createSetlist);
router.post('/api/setlists/duplicate', duplicateSetlist);
router.get('/api/setlists/get', getSetlist);
router.put('/api/setlists/update', updateSetlist);
router.put('/api/setlists/delete', deleteSetlist);

export default router.getRouter();
