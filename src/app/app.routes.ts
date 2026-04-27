import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing';
import { MemberListComponent } from './member-list-component/member-list-component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'list/:id', component: MemberListComponent },
];
