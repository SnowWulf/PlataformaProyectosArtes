import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth, LoginResponse } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  email = '';
  password = '';

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  ingresar(): void {
    this.authService.login(
      this.email,
      this.password
    )
    .subscribe({
      next: (data: LoginResponse) => {
        console.log('Login correcto', data);
        this.authService.guardarSesion(data);

        // Si el usuario ingresó por primera vez con contraseña temporal
        if (data.user?.require_password_change) {
          this.router.navigate(['/cambiar-password']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        console.error('Error login', err);
      }
    });
  }

}