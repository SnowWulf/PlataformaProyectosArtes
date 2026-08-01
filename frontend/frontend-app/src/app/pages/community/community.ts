import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CommunityService } from '../../services/community-service';

import { User } from '../../models/user';
import { ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  selector: 'app-community',
  standalone: true,
  templateUrl: './community.html',
  styleUrl: './community.scss'

})
export class Community implements OnInit {

  filtroRol = 'todos';

  usuarios: User[] = [];

  busqueda = '';


  constructor(

  
    private communityService:CommunityService,
    private cdr: ChangeDetectorRef
  ) {

  }
  ngOnInit(): void {

    this.cargarUsuarios();

  }


  cargarUsuarios(): void {

    this.communityService
      .getUsers()
      .subscribe({

        next: (data) => {
          console.log('Usuarios recibidos:', data);
          this.usuarios = data;
          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(err);

        }

      });

  }

  get usuariosFiltrados(): User[] {

    return this.usuarios.filter(
      usuario => {

        const texto =
          this.busqueda.toLowerCase();

        const coincideBusqueda =

          usuario.name
            .toLowerCase()
            .includes(texto)

          ||

          (
            usuario.programa ?? ''
          )
            .toLowerCase()
            .includes(texto);

        const coincideRol =

          this.filtroRol === 'todos'

          ||

          usuario.role?.nombre ===
          this.filtroRol;

        return (
          coincideBusqueda &&
          coincideRol
        );

      }
    );

  }


}