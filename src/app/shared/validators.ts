import { AbstractControl, ValidationErrors } from '@angular/forms';

export function apenasDigitos(valor: unknown): string {
  return String(valor ?? '').replace(/\D/g, '');
}

export function cpfValidator(control: AbstractControl): ValidationErrors | null {
  const valor = apenasDigitos(control.value);
  if (!valor) {
    return null;
  }
  if (valor.length !== 11 || /^(\d)\1{10}$/.test(valor)) {
    return { cpfInvalido: true };
  }
  const digito = (base: number): number => {
    let soma = 0;
    for (let i = 0; i < base; i++) {
      soma += Number(valor[i]) * (base + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(valor[9]) && digito(10) === Number(valor[10])
    ? null
    : { cpfInvalido: true };
}

/** Data no formato AAAA-MM-DD (input type="date"): exige 18 anos completos. */
export function maioridadeValidator(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) {
    return null;
  }
  const nascimento = new Date(valor + 'T00:00:00');
  if (isNaN(nascimento.getTime()) || nascimento.getFullYear() < 1900 || nascimento > new Date()) {
    return { dataInvalida: true };
  }
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 18);
  return nascimento <= limite ? null : { menorDeIdade: true };
}

/** Mínimo de 8 caracteres, com ao menos uma letra e um número. */
export function senhaForteValidator(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  if (!valor) {
    return null;
  }
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(valor) ? null : { senhaFraca: true };
}

/** Nome e sobrenome. */
export function nomeCompletoValidator(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '').trim();
  if (!valor) {
    return null;
  }
  return /^\S{2,}(\s+\S+)+$/.test(valor) ? null : { nomeIncompleto: true };
}

export function senhasIguaisValidator(campoSenha: string, campoConfirma: string) {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const senha = grupo.get(campoSenha)?.value;
    const confirma = grupo.get(campoConfirma)?.value;
    return senha && confirma && senha !== confirma ? { senhasDiferentes: true } : null;
  };
}
