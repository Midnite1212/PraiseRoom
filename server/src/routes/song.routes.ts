import {
  createSong,
  deleteSong,
  getSong,
  getSongView,
  searchSongs,
  updateSong,
} from '../controllers/song.controllers';
import {
  convertImportText,
  fetchImportChart,
  getImportMetadata,
  searchImportCandidates,
} from '../controllers/songImport.controllers';
import { createPermissionRouter } from '../policies';

const router = createPermissionRouter();

router.post('/api/songs/create', createSong);
router.get('/api/songs/get', getSong);
router.get('/api/songs/get-view', getSongView);
router.put('/api/songs/update', updateSong);
router.put('/api/songs/delete', deleteSong);
router.get('/api/songs/search', searchSongs);
router.get('/api/songs/import/search', searchImportCandidates);
router.post('/api/songs/import/fetch', fetchImportChart);
router.post('/api/songs/import/convert', convertImportText);
router.get('/api/songs/import/metadata', getImportMetadata);

export default router.getRouter();
