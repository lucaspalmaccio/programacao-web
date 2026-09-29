import { Directive, HostListener, Input, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

export type TipoMascara = 'cpf' | 'telefone' | 'cep';

export function aplicarMascara(valor: string, tipo: TipoMascara): string {
  const d = valor.replace(/\D/g, '');
  if (tipo === 'cpf') {
    const n = d.slice(0, 11);
    return n
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }
  if (tipo === 'cep') {
    return d.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  }
  const n = d.slice(0, 11);
  if (n.length <= 2) {
    return n ? '(' + n : '';
  }
  if (n.length <= 6) {
    return n.replace(/^(\d{2})(\d+)/, '($1) $2');
  }
  if (n.length <= 10) {
    return n.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  }
  return n.replace(/^(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}

/** Formata CPF, telefone ou CEP enquanto a pessoa digita. */
@Directive({
  selector: 'input[appMascara]',
  standalone: true
})
export class MascaraDirective {
  @Input('appMascara') tipo: TipoMascara = 'cpf';

  constructor(@Optional() private controle: NgControl) {}

  @HostListener('input', ['$event'])
  aoDigitar(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const formatado = aplicarMascara(campo.value, this.tipo);
    if (formatado !== campo.value) {
      campo.value = formatado;
    }
    if (this.controle?.control && this.controle.control.value !== formatado) {
      this.controle.control.setValue(formatado);
    }
  }
}
