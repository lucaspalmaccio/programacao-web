import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EsqueciSenhaComponent } from '../esqueci-senha/esqueci-senha.component';
import { AuthService } from '../../services/auth.service';
import {
  cpfValidator,
  maioridadeValidator,
  nomeCompletoValidator,
  senhaForteValidator,
  senhasIguaisValidator
} from '../../shared/validators';
import { MascaraDirective } from '../../shared/mascara.directive';

@Component({
  selector: 'app-login-cadastro',
  standalone: true,
  imports: [ReactiveFormsModule, EsqueciSenhaComponent, MascaraDirective],
  templateUrl: './login-cadastro.component.html',
  styleUrl: './login-cadastro.component.scss'
})
export class LoginCadastroComponent implements OnInit {
  modo: 'login' | 'cadastro' = 'login';
  loginEnviado = false;
  cadastroEnviado = false;
  cadastroSucesso = false;
  recuperacaoAberta = false;
  enviando = false;
  erroLogin = '';
  erroCadastro = '';
  mostrarSenha = false;

  formLogin: FormGroup;
  formCadastro: FormGroup;

  private retorno = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.formLogin = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]]
    });

    this.formCadastro = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), nomeCompletoValidator]],
      email: ['', [Validators.required, Validators.email]],
      nascimento: ['', [Validators.required, maioridadeValidator]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/), cpfValidator]],
      telefone: ['', [Validators.required, Validators.pattern(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/)]],
      senha: ['', [Validators.required, senhaForteValidator]],
      confirmaSenha: ['', [Validators.required]],
      termos: [false, [Validators.requiredTrue]]
    }, { validators: senhasIguaisValidator('senha', 'confirmaSenha') });
  }

  ngOnInit(): void {
    const destino = this.route.snapshot.queryParamMap.get('returnUrl');
    // só aceita caminhos internos, para não redirecionar para outro site
    if (destino && destino.startsWith('/') && !destino.startsWith('//')) {
      this.retorno = destino;
    }
    if (this.authService.usuarioLogado()) {
      this.router.navigateByUrl(this.retorno === '/' ? '/perfil' : this.retorno);
    }
  }

  abrirRecuperacao(): void {
    this.recuperacaoAberta = true;
  }

  fecharRecuperacao(): void {
    this.recuperacaoAberta = false;
  }

  irParaCadastro(): void {
    this.modo = 'cadastro';
  }

  irParaLogin(): void {
    this.modo = 'login';
  }

  async enviarLogin(): Promise<void> {
    this.loginEnviado = true;
    this.erroLogin = '';
    if (this.formLogin.invalid || this.enviando) {
      return;
    }
    this.enviando = true;
    const { email, senha } = this.formLogin.value;
    const resultado = await this.authService.login(email, senha);
    this.enviando = false;
    if (!resultado.ok) {
      this.erroLogin = resultado.erro ?? 'Não foi possível entrar.';
      return;
    }
    this.router.navigateByUrl(this.retorno);
  }

  async enviarCadastro(): Promise<void> {
    this.cadastroEnviado = true;
    this.erroCadastro = '';
    if (this.formCadastro.invalid || this.enviando) {
      return;
    }
    this.enviando = true;
    const { nome, email, nascimento, cpf, telefone, senha } = this.formCadastro.value;
    const resultado = await this.authService.cadastrar({ nome, email, nascimento, cpf, telefone, senha });
    this.enviando = false;
    if (!resultado.ok) {
      this.erroCadastro = resultado.erro ?? 'Não foi possível concluir o cadastro.';
      return;
    }
    this.cadastroSucesso = true;
    setTimeout(() => this.router.navigateByUrl(this.retorno), 1200);
  }

  campoInvalido(form: FormGroup, campo: string, enviado: boolean): boolean {
    const c = form.get(campo);
    return !!c && c.invalid && (c.touched || enviado);
  }

  get retornoPedido(): boolean {
    return this.retorno === '/cesta';
  }

  get confirmaComErro(): boolean {
    const c = this.formCadastro.get('confirmaSenha');
    return !!c && (c.touched || this.cadastroEnviado) &&
      (c.invalid || !!this.formCadastro.errors?.['senhasDiferentes']);
  }
}
