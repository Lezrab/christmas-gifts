import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  //{ path: 'list/:id', component: MemberListComponent }, // On créera ce composant après
];
