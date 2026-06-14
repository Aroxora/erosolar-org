import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { Work } from './pages/work';
import { Blog } from './pages/blog';
import { Tracker } from './pages/tracker';
import { Jobs } from './pages/jobs';
import { Applications } from './pages/applications';
import { PhdLabs } from './pages/phd-labs';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'work', component: Work },
  { path: 'blog', component: Blog },
  { path: 'tracker', component: Tracker },
  { path: 'jobs', component: Jobs },
  { path: 'applications', component: Applications },
  { path: 'phd-labs', component: PhdLabs },
  { path: '**', redirectTo: '' },
];
