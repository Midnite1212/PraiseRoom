import { ComponentType, LazyExoticComponent, lazy } from 'react';
import type { RoutePermission } from './components/custom/PrivateRouteWrapper';

const HomeContainer = lazy(() => import('./components/home/HomeContainer'));
const MainLoginContainer = lazy(() => import('./components/auth/MainLoginContainer'));
const SongEditorContainer = lazy(() => import('./components/song/SongEditorContainer'));
const SongListContainer = lazy(() => import('./components/song/SongListContainer'));
const ProfileContainer = lazy(() => import('./components/profile/ProfileContainer'));
const SongsViewContainer = lazy(() => import('./components/songsView/SongsViewContainer'));
const SetlistListContainer = lazy(() => import('./components/setlist/SetlistListContainer'));
const SetlistEditorContainer = lazy(() => import('./components/setlist/SetlistEditorContainer'));
const SetlistViewContainer = lazy(() => import('./components/setlistView/SetlistViewContainer'));
const SetlistAdminViewContainer = lazy(
  () => import('./components/setlist/adminView/SetlistAdminViewContainer')
);
const SetlistFolderDetail = lazy(() => import('./components/setlist/SetlistFolderDetail'));
const ErrorPage = lazy(() => import('./components/custom/ErrorPage'));

type AppRoute = {
  key: string;
  title: string;
  path: string;
  enabled: boolean;
  component: ComponentType | LazyExoticComponent<ComponentType>;
  permissions: RoutePermission[];
};

export const routes: AppRoute[] = [
  // Auth routes
  {
    key: 'login-route',
    title: 'Login',
    path: '/login',
    enabled: true,
    component: MainLoginContainer,
    permissions: ['noUser'],
  },
  {
    key: 'register-route',
    title: 'Register',
    path: '/register',
    enabled: true,
    component: MainLoginContainer,
    permissions: ['noUser'],
  },
  {
    key: 'recover-password-route',
    title: 'Recover Password',
    path: '/password/recover',
    enabled: true,
    component: MainLoginContainer,
    permissions: ['noUser'],
  },
  {
    key: 'reset-password-route',
    title: 'Reset Password',
    path: '/password/new',
    enabled: true,
    component: MainLoginContainer,
    permissions: ['noUser'],
  },
  // Home routes
  {
    key: 'home-route',
    title: 'Home',
    path: '/',
    enabled: true,
    component: HomeContainer,
    permissions: ['user'],
  },
  {
    key: 'profile-route',
    title: 'Profile',
    path: '/profile',
    enabled: true,
    component: ProfileContainer,
    permissions: ['user'],
  },
  // Song routes
  {
    key: 'song-route',
    title: 'Song',
    path: '/song',
    enabled: true,
    component: SongListContainer,
    permissions: ['user'],
  },
  {
    key: 'song-add-route',
    title: 'Add New Song',
    path: '/song/add',
    enabled: true,
    component: SongEditorContainer,
    permissions: ['admin'],
  },
  {
    key: 'song-edit-route',
    title: 'Edit Song',
    path: '/song/edit/:id',
    enabled: true,
    component: SongEditorContainer,
    permissions: ['admin'],
  },
  {
    key: 'songsView-route',
    title: 'songsView',
    path: '/song/:id',
    enabled: true,
    component: SongsViewContainer,
    permissions: ['user'],
  },
  // Setlist routes
  {
    key: 'setlist-route',
    title: 'Setlist',
    path: '/setlist/:id?',
    enabled: true,
    component: SetlistListContainer,
    permissions: ['user'],
  },
  {
    key: 'setlist-admin-route',
    title: 'Setlist',
    path: '/setlist/details/:id?',
    enabled: true,
    component: SetlistAdminViewContainer,
    permissions: ['user'],
  },
  {
    key: 'setlist-folder-route',
    title: 'Setlist',
    path: '/setlist/folder/:id?',
    enabled: true,
    component: SetlistFolderDetail,
    permissions: ['user'],
  },
  {
    key: 'setlist-add-route',
    title: 'Add New Setlist',
    path: '/setlist/add',
    enabled: true,
    component: SetlistEditorContainer,
    permissions: ['user'],
  },
  {
    key: 'setlist-edit-route',
    title: 'Edit Setlist',
    path: '/setlist/edit/:id',
    enabled: true,
    component: SetlistEditorContainer,
    permissions: ['user'],
  },
  {
    key: 'setlist-view-route',
    title: 'View Setlist',
    path: '/setlist/view/:id',
    enabled: true,
    component: SetlistViewContainer,
    permissions: ['public', 'noUser'],
  },
  {
    key: 'not-found-route',
    title: 'Page Not Found',
    path: '*',
    enabled: true,
    component: ErrorPage,
    permissions: ['public'],
  },
];
