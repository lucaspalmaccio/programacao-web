import { Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toast.mensagem(); as texto) {
      <div class="toast-vinho" role="status" aria-live="polite">
        <i class="bi bi-check-circle-fill text-dourado me-2"></i>{{ texto }}
      </div>
    }
  `,
  styles: [`
    .toast-vinho {
      position: fixed;
      left: 50%;
      bottom: 1.5rem;
      transform: translateX(-50%);
      z-index: 1090;
      max-width: 90vw;
      padding: 0.75rem 1.25rem;
      border-radius: 2rem;
      background: var(--vinho-bordo-escuro);
      color: #fff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      animation: subir 0.25s ease-out;
    }
    @keyframes subir {
      from { opacity: 0; transform: translate(-50%, 12px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `]
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
