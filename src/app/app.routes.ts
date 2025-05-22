import { Routes } from '@angular/router';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { LoginComponent  } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AircraftComponent } from './pages/aircraft/aircraft.component';
import { FinancialComponent } from './pages/financial/financial.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    {
        path: 'signup',
        component: SignUpComponent,
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard]
    },
    {
        path: 'aircraft/:id',
        component: AircraftComponent,
        canActivate: [authGuard]
    },
    {
        path: 'financial/:id',
        component: FinancialComponent,
        canActivate: [authGuard]
    },
    { path: '**', redirectTo: '/login' }
];
