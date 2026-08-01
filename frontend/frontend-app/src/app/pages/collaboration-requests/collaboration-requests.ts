import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  CommunityService
} from '../../services/community-service';

import {
  Auth
} from '../../services/auth';

import {
  ChangeDetectorRef
} from '@angular/core';

@Component({

  selector:
    'app-collaboration-requests',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './collaboration-requests.html'

})
export class CollaborationRequests
implements OnInit {

  recibidas: any[] = [];

  enviadas: any[] = [];

  vistaActiva = 'recibidas';

  constructor(

  private communityService: CommunityService,

  private auth: Auth,

  private cdr: ChangeDetectorRef

) {}

ngOnInit(): void {

  const usuario =
    this.auth.obtenerUsuario();

  console.log(
    'Usuario logueado:',
    usuario
  );

  if (!usuario) {
    return;
  }

  this.communityService
  .getReceivedRequests(usuario.id)
  .subscribe(data => {

    this.recibidas = data;

    this.cdr.detectChanges();

  });

this.communityService
  .getSentRequests(usuario.id)
  .subscribe(data => {

    this.enviadas = data;

    this.cdr.detectChanges();

  });

}

  aceptarSolicitud(
  id: number
): void {

  this.communityService
    .acceptRequest(id)
    .subscribe(() => {

      this.ngOnInit();

    });

}

rechazarSolicitud(
  id: number
): void {

  this.communityService
    .rejectRequest(id)
    .subscribe(() => {

      this.ngOnInit();

    });

}

get recibidasPendientes() {

  return this.recibidas.filter(

    solicitud =>

      solicitud.estado ===
      'Pendiente'

  );

}
get enviadasPendientes() {

  return this.enviadas.filter(

    solicitud =>

      solicitud.estado ===
      'Pendiente'

  );

}
get historial() {

  return [

    ...this.recibidas,

    ...this.enviadas

  ].filter(

    solicitud =>

      solicitud.estado !==
      'Pendiente'

  );

}

}