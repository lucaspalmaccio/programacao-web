import { Routes } from '@angular/router';
import { VitrineComponent } from './pages/vitrine/vitrine.component';
import { LoginCadastroComponent } from './pages/login-cadastro/login-cadastro.component';
import { DetalheComponent } from './pages/detalhe/detalhe.component';
import { CestaComponent } from './pages/cesta/cesta.component';
import { BuscaComponent } from './pages/busca/busca.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { PedidosComponent } from './pages/pedidos/pedidos.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: VitrineComponent, title: 'Di Vino' },
  { path: 'login', component: LoginCadastroComponent, title: 'Login / Cadastro' },
  { path: 'esqueci-senha', redirectTo: 'login' },
  { path: 'produto/:id', component: DetalheComponent, title: 'Detalhe do produto' },
  { path: 'cesta', component: CestaComponent, title: 'Cesta' },
  { path: 'perfil', component: PerfilComponent, canActivate: [authGuard], title: 'Meu perfil' },
  { path: 'pedidos', component: PedidosComponent, canActivate: [authGuard], title: 'Meus pedidos' },
  { path: 'busca', component: BuscaComponent, title: 'Busca' },
  { path: '**', redirectTo: '' }
];
