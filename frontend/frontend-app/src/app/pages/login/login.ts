import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../services/auth';


@Component({
  selector:'app-login',
  standalone:true,
  imports:[
    FormsModule
  ],
  templateUrl:'./login.html',
  styleUrl:'./login.scss'
})
export class Login {


  email='';
  password='';


  constructor(
  private authService: Auth,
  private router: Router
){}



  ingresar(){


    this.authService.login(
      this.email,
      this.password
    )
    .subscribe({

      next:(data)=>{


        console.log(
          'Login correcto',
          data
        );


        this.authService.guardarSesion(data);


        this.router.navigate(['/dashboard']);

      },


      error:(err)=>{

        console.error(
          'Error login',
          err
        );

      }

    });


  }


}
