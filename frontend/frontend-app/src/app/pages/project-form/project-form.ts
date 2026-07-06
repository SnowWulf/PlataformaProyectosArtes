import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { Project } from '../../models/project';
import { ProjectService } from '../../services/project-service';

@Component({
  selector: 'app-project-form',
  imports: [
  ReactiveFormsModule
  ],
  templateUrl: './project-form.html',
  styleUrl: './project-form.scss',
  
})
export class ProjectForm implements OnChanges {

  @Input()
  proyecto: Project | null = null;

  @Output()
  guardado = new EventEmitter<void>();

  form!: FormGroup;

  constructor(
  private fb: FormBuilder,
  private projectService: ProjectService
  ) {

  this.form = this.fb.group({

    titulo: [''],

    descripcion: [''],

    tipo_proyecto: [''],

    estado: [''],

    fecha_inicio: ['']

  });

  }
  ngOnChanges(changes: SimpleChanges): void {

  if (changes['proyecto'] && this.proyecto) {

    this.form.patchValue({

      titulo: this.proyecto.titulo,

      descripcion: this.proyecto.descripcion,

      tipo_proyecto: this.proyecto.tipo_proyecto,

      estado: this.proyecto.estado,

      fecha_inicio: this.proyecto.fecha_inicio

    });

  }

}

guardar(): void {

  console.log('Entró al método guardar');

  if (this.form.invalid) {

    return;

  }
  console.log('Proyecto recibido:', this.proyecto);
  const peticion = this.proyecto
    ? this.projectService.updateProject(
        this.proyecto.id!,
        this.form.value
      )
    : this.projectService.createProject(
        this.form.value
      );

  peticion.subscribe({

    next: (project) => {

      console.log(
        'Proyecto guardado correctamente',
        project
      );

      this.guardado.emit();

    },

    error: (err) => {

      console.error(
        'Error al guardar proyecto',
        err
      );

    }

  });

}
}

