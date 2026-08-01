import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnInit
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import { User } from '../../models/user';
import { Role } from '../../models/role';

import { UserService } from '../../services/user-service';
import { RoleService } from '../../services/role-service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserForm implements OnChanges, OnInit {

  @Input()
  usuario: User | null = null;

  @Output()
  cerrar = new EventEmitter<void>();

  @Output()
  guardado = new EventEmitter<void>();

  form: FormGroup;

  roles: Role[] = [];

  programasPregrado = [

  'Arquitectura',
  'Artes Visuales',
  'Diseño Gráfico',
  'Diseño Industrial',
  'Licenciatura en Artes Visuales',
  'Licenciatura en Música'

];

programasPosgrado = [

  'Maestría en Diseño para la Innovación Social',
  'Maestría en Investigación / Creación Arte y Contexto'

];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService
  ) {

    

    this.form = this.fb.group({

      name: [
        '',
        Validators.required
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [''],

      role_id: [
        '',
        Validators.required
      ],

      programa: ['']

    });

    this.form
    .get('role_id')
    ?.valueChanges
    .subscribe(() => {

      if (!this.esEstudiante()) {

        this.form.patchValue({

          programa: ''

        });

      }

    });

  }

  ngOnInit(): void {

    this.cargarRoles();


  }

  ngOnChanges(): void {

    this.cargarDatosUsuario();

  }

  cargarRoles(): void {

    this.roleService.getRoles().subscribe({

      next: (data) => {

        this.roles = data;

        this.cargarDatosUsuario();

      },

      error: (err) => {

        console.error(
          'Error al cargar roles',
          err
        );

      }

    });

  }

  private cargarDatosUsuario(): void {

    const passwordControl = this.form.get('password');

    if (!this.usuario) {

      passwordControl?.setValidators([
        Validators.required,
        Validators.minLength(6)
      ]);

      passwordControl?.updateValueAndValidity();

      this.form.reset();


      return;

    }

    passwordControl?.clearValidators();

    passwordControl?.updateValueAndValidity();

    this.form.patchValue({

      name: this.usuario.name,

      email: this.usuario.email,

      role_id: this.usuario.role_id,

      password: ''

    });

  }

  guardar(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    // EDITAR
    if (this.usuario) {

      this.userService.updateUser(

        this.usuario.id,

        this.form.value

      ).subscribe({

        next: () => {

          alert('Usuario actualizado correctamente.');

          this.guardado.emit();

          this.cerrar.emit();

        },

        error: (err) => {

          console.error(err);

          alert('No fue posible actualizar el usuario.');

        }

      });

    }

    // CREAR
    else {

      this.userService.createUser(

        this.form.value

      ).subscribe({

        next: () => {

          alert('Usuario creado correctamente.');

          this.form.reset();
          this.cargarDatosUsuario();

          this.guardado.emit();

          this.cerrar.emit();

        },

        error: (err) => {

          console.error(err);

          alert('No fue posible crear el usuario.');

        }

      });

    }

  }

  esEstudiante(): boolean {

  const rolId =
    Number(
      this.form.get('role_id')?.value
    );

  const rol =
    this.roles.find(
      r => r.id === rolId
    );

  return rol?.nombre === 'Estudiante';

}

}