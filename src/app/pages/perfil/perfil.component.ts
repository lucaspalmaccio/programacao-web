import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import {
  maioridadeValidator,
  nomeCompletoValidator,
  senhaForteValidator,
  senhasIguaisValidator
} from '../../shared/validators';
import { MascaraDirective } from '../../shared/mascara.directive';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MascaraDirective],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {
  usuario!: Usuario;

  formDados: FormGroup;
  formEndereco: FormGroup;
  formSenha: FormGroup;

  dadosEnviado = false;
  enderecoEnviado = false;
  senhaEnviada = false;
  erroSenha = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.formDados = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), nomeCompletoValidator]],
      nascimento: ['', [Validators.required, maioridadeValidator]],
      telefone: ['', [Validators.required, Validators.pattern(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/)]]
    });

    this.formEndereco = this.fb.group({
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      endereco: ['', [Validators.required, Validators.minLength(5)]],
      numero: ['', [Validators.required, Validators.pattern(/^\d+[A-Za-z]?$/)]],
      cidade: ['', [Validators.required, Validators.minLength(2)]],
      uf: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]]
    });

    this.formSenha = this.fb.group({
      senhaAtual: ['', [Validators.required]],
      novaSenha: ['', [Validators.required, senhaForteValidator]],
      confirmaSenha: ['', [Validators.required]]
    }, { validators: senhasIguaisValidator('novaSenha', 'confirmaSenha') });
  }

  ngOnInit(): void {
    const atual = this.authService.usuarioLogado();
    if (!atual) {
      this.router.navigate(['/login']);
      return;
    }
    this.usuario = atual;
    this.formDados.patchValue({
      nome: atual.nome,
      nascimento: atual.nascimento,
      telefone: atual.telefone
    });
    if (atual.endereco) {
      this.formEndereco.patchValue(atual.endereco);
    }
  }

  salvarDados(): void {
    this.dadosEnviado = true;
    if (this.formDados.invalid) {
      return;
    }
    const { nome, nascimento, telefone } = this.formDados.value;
    const resultado = this.authService.atualizarPerfil({ nome: nome.trim(), nascimento, telefone });
    if (resultado.ok) {
      this.usuario = this.authService.usuarioLogado()!;
      this.dadosEnviado = false;
      this.toast.mostrar('Dados atualizados com sucesso');
    }
  }

  salvarEndereco(): void {
    this.enderecoEnviado = true;
    if (this.formEndereco.invalid) {
      return;
    }
    const valor = this.formEndereco.value;
    const resultado = this.authService.atualizarPerfil({
      endereco: { ...valor, uf: String(valor.uf).toUpperCase() }
    });
    if (resultado.ok) {
      this.usuario = this.authService.usuarioLogado()!;
      this.enderecoEnviado = false;
      this.toast.mostrar('Endereço salvo com sucesso');
    }
  }

  async alterarSenha(): Promise<void> {
    this.senhaEnviada = true;
    this.erroSenha = '';
    if (this.formSenha.invalid) {
      return;
    }
    const { senhaAtual, novaSenha } = this.formSenha.value;
    if (senhaAtual === novaSenha) {
      this.erroSenha = 'A nova senha deve ser diferente da atual.';
      return;
    }
    const resultado = await this.authService.alterarSenha(senhaAtual, novaSenha);
    if (!resultado.ok) {
      this.erroSenha = resultado.erro ?? 'Não foi possível alterar a senha.';
      return;
    }
    this.formSenha.reset();
    this.senhaEnviada = false;
    this.toast.mostrar('Senha alterada com sucesso');
  }

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  invalido(form: FormGroup, campo: string, enviado: boolean): boolean {
    const c = form.get(campo);
    return !!c && c.invalid && (c.touched || enviado);
  }

  get confirmaComErro(): boolean {
    const c = this.formSenha.get('confirmaSenha');
    return !!c && (c.touched || this.senhaEnviada) &&
      (c.invalid || !!this.formSenha.errors?.['senhasDiferentes']);
  }
}
