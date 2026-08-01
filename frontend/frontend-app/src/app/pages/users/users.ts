import {
  Component,
  afterNextRender,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { User } from '../../models/user';

import { UserService } from '../../services/user-service';

import { UserForm } from '../user-form/user-form';

import { DeleteUserDialog } from '../../components/delete-user-dialog/delete-user-dialog';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    UserForm,
    DeleteUserDialog,
    FormsModule
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users {

  users: User[] = [];

  mostrarFormulario = false;

  usuarioSeleccionado: User | null = null;

  mostrarDialogoEliminar = false;

  usuarioAEliminar: User | null = null;

  busqueda = '';

  filtroRol = 'todos';

  filtroPrograma = 'todos';

  mostrarFiltroPrograma = false;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {

    afterNextRender(() => {

      this.cargarUsuarios();

    });

  }

  cargarUsuarios(): void {

    this.userService
      .getUsers()
      .subscribe({

        next: (data) => {

          this.users = data;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(err);

        }

      });

  }

  nuevoUsuario(): void {

    this.usuarioSeleccionado = null;

    this.mostrarFormulario = true;

  }

  editarUsuario(usuario: User): void {

    this.usuarioSeleccionado = usuario;

    this.mostrarFormulario = true;

  }

  cerrarFormulario(): void {

    this.mostrarFormulario = false;

    this.usuarioSeleccionado = null;

  }

  abrirEliminar(usuario: User): void {

    this.usuarioAEliminar = usuario;

    this.mostrarDialogoEliminar = true;

  }

  cerrarEliminar(): void {

    this.mostrarDialogoEliminar = false;

    this.usuarioAEliminar = null;

  }

  confirmarEliminar(password: string): void {

    if (!this.usuarioAEliminar) {

      return;

    }

    this.userService
      .deleteUserWithPassword(
        this.usuarioAEliminar.id,
        password
      )
      .subscribe({

        next: (response) => {

          alert(response.message);

          this.cerrarEliminar();

          this.cargarUsuarios();

        },

        error: (err) => {

          console.error(err);

          if (err.status === 401) {

            alert('Contraseña incorrecta.');

          } else if (err.status === 400) {

            alert(err.error.message);

          } else {

            alert('No fue posible eliminar el usuario.');

          }

        }

      });

  }

  usuarioGuardado(): void {

    this.cargarUsuarios();

    this.cerrarFormulario();

  }

  get usuariosFiltrados() {

    return this.users.filter(usuario => {

      const coincideBusqueda =

        usuario.name
          .toLowerCase()
          .includes(
            this.busqueda.toLowerCase()
          ) ||

        usuario.email
          .toLowerCase()
          .includes(
            this.busqueda.toLowerCase()
          );

      const coincideRol =

        this.filtroRol === 'todos' ||

        usuario.role?.nombre ===
        this.filtroRol;

      const coincidePrograma =

        this.filtroPrograma ===
        'todos' ||

        usuario.programa ===
        this.filtroPrograma;

      return (
        coincideBusqueda &&
        coincideRol &&
        coincidePrograma
      );

    });


  }

get programasDisponibles(): string[] {

  return [
    ...new Set(
      this.users
        .map(usuario => usuario.programa)
        .filter((programa): programa is string => !!programa)
    )
  ];

}
toggleFiltroPrograma() {

  this.mostrarFiltroPrograma = !this.mostrarFiltroPrograma;

}

seleccionarPrograma(programa: string) {
  this.filtroPrograma = programa;
  this.mostrarFiltroPrograma = false; // <--- Cierra el menú desplegable
}
}



//   eliminarUsuario(usuario: User): void {

//   const confirmar = confirm(

//     `¿Desea eliminar al usuario ${usuario.name}?`

//   );

//   if (!confirmar) {

//     return;

//   }

//   this.userService
//     .deleteUser(usuario.id)
//     .subscribe({

//       next: () => {

//         alert('Usuario eliminado correctamente.');

//         this.cargarUsuarios();

//       },

//       error: (err) => {

//         console.error(err);

//         alert('No fue posible eliminar el usuario.');

//       }

//     });

// }

