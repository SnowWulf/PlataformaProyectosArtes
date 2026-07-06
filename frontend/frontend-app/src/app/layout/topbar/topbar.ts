import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector:'app-topbar',
  standalone:true,
  templateUrl:'./topbar.html',
  styleUrl:'./topbar.scss'
})
export class Topbar {

  usuario:any;

  constructor(
    private auth:Auth,
    private router:Router
  ){

    this.usuario=this.auth.obtenerUsuario();

  }

  logout(){

    this.auth.logout();

    this.router.navigate(['/login']);

  }

}