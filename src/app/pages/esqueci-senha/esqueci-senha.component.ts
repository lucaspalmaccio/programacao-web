import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './esqueci-senha.component.html',
  styleUrl: './esqueci-senha.component.scss'
})
export class EsqueciSenhaComponent {
  @Output() fechar = new EventEmitter<void>();

  form: FormGroup;
  enviado = false;
  sucesso = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  @HostListener('document:keydown.escape')
  aoPressionarEsc(): void {
    this.fechar.emit();
  }

  enviar(): void {
    this.enviado = true;
    if (this.form.invalid) {
      return;
    }
    this.sucesso = this.authService.solicitarRecuperacaoSenha(this.form.value.email);
  }

  campoInvalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || this.enviado);
  }
}
