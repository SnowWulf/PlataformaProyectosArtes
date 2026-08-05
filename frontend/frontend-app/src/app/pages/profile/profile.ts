import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user-service';

@Component({

  selector: 'app-profile',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule

  ],

  templateUrl: './profile.html',
  styleUrl:'./profile.scss'

})
export class Profile
implements OnInit {

  usuario: any = {};

  foto: File | null = null;

  constructor(
    private userService: UserService
  ) {}

  ngOnInit(): void {

    this.userService
      .getProfile()
      .subscribe({

        next: data => {

          this.usuario = data;

        }

      });

  }

  seleccionarFoto(
    event: any
  ) {

    this.foto =
      event.target.files[0];

  }

guardarPerfil() {

  const formData =
    new FormData();

  formData.append(

    'bio',

    this.usuario.bio || ''

  );

  formData.append(

    'mostrar_proyectos',

    this.usuario.mostrar_proyectos
      ? '1'
      : '0'

  );

  formData.append(

    'mostrar_correo',

    this.usuario.mostrar_correo
      ? '1'
      : '0'

  );

  if (this.foto) {

    formData.append(

      'foto',

      this.foto

    );

  }

  this.userService
    .updateProfile(formData)
    .subscribe({

      next: response => {

        console.log(
          'Respuesta:',
          response
        );

        this.usuario =
          response.user;

        alert(
          'Perfil actualizado.'
        );

      },

      error: err => {

        console.error(
          'Error completo:',
          err
        );

        console.error(
          'Error Laravel:',
          err.error
        );

      }

    });

}

}