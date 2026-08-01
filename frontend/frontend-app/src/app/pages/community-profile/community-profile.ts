import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute } from '@angular/router';

import { CommunityService }
  from '../../services/community-service';

import { User } from '../../models/user';

import { ChangeDetectorRef } from '@angular/core';

import {
  CommunityProject
} from '../../models/community-project';

import { Auth }
from '../../services/auth';

@Component({
  selector: 'app-community-profile',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl:
    './community-profile.html',
  styleUrl:
    './community-profile.scss'
})
export class CommunityProfile
  implements OnInit {

  usuario:
    User | null = null;

    proyectos:
  CommunityProject[] = [];

  constructor(
  private route: ActivatedRoute,
  private communityService: CommunityService,
  private cdr: ChangeDetectorRef,
  private auth: Auth
) {}

  ngOnInit(): void {

    this.route.paramMap
      .subscribe(params => {

        const id = Number(
          params.get('id')
        );

        console.log(
          'ID:',
          id
        );

        this.cargarUsuario(id);

      });

  }

  cargarUsuario(
    id: number
  ): void {

    this.communityService
      .getUser(id)
      .subscribe({

        next: (usuario) => {

          this.cargarProyectos(id);

  console.log('Usuario cargado:', usuario);

  this.usuario = usuario;

  this.cdr.detectChanges();

},

        error: (err) => {

          console.error(
            err
          );

        }

      });

  }

  cargarProyectos(
  id: number
): void {

  this.communityService
    .getProjects(id)
    .subscribe({

      next: (proyectos) => {
        
        this.proyectos =
          proyectos;

        this.cdr.detectChanges();

      },

      error: (err) => {

        console.error(err);

      }

    });

}

solicitarColaboracion(
  projectId: number
): void {

  const usuario =
    this.auth.obtenerUsuario();

  if (!usuario) {

    return;

  }

  this.communityService
    .requestCollaboration(

      projectId,

      usuario.id

    )
    .subscribe({

      next: () => {

        alert(
          'Solicitud enviada.'
        );

      },

      error: (err) => {

  console.error(err);

  alert(
    err.error?.message
  );

}

    });

}

}