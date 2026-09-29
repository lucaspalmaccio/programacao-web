import { FormControl, FormGroup } from '@angular/forms';
import {
  cpfValidator,
  maioridadeValidator,
  nomeCompletoValidator,
  senhaForteValidator,
  senhasIguaisValidator
} from './validators';
import { aplicarMascara } from './mascara.directive';

function dataHa(anos: number, dias = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anos);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

describe('Validadores', () => {
  describe('CPF', () => {
    it('aceita CPF válido com e sem máscara', () => {
      expect(cpfValidator(new FormControl('529.982.247-25'))).toBeNull();
      expect(cpfValidator(new FormControl('52998224725'))).toBeNull();
    });
    it('rejeita dígitos verificadores errados', () => {
      expect(cpfValidator(new FormControl('529.982.247-26'))).toEqual({ cpfInvalido: true });
    });
    it('rejeita sequências repetidas', () => {
      expect(cpfValidator(new FormControl('111.111.111-11'))).toEqual({ cpfInvalido: true });
    });
    it('rejeita tamanho errado', () => {
      expect(cpfValidator(new FormControl('123'))).toEqual({ cpfInvalido: true });
    });
    it('não reclama de campo vazio (required cuida disso)', () => {
      expect(cpfValidator(new FormControl(''))).toBeNull();
    });
  });

  describe('Maioridade', () => {
    it('aceita quem completou 18 anos hoje', () => {
      expect(maioridadeValidator(new FormControl(dataHa(18)))).toBeNull();
    });
    it('rejeita quem faz 18 anos amanhã', () => {
      expect(maioridadeValidator(new FormControl(dataHa(18, 1)))).toEqual({ menorDeIdade: true });
    });
    it('rejeita data futura e data absurda', () => {
      expect(maioridadeValidator(new FormControl('2999-01-01'))).toEqual({ dataInvalida: true });
      expect(maioridadeValidator(new FormControl('1800-01-01'))).toEqual({ dataInvalida: true });
    });
  });

  describe('Senha forte', () => {
    it('exige 8+ caracteres com letra e número', () => {
      expect(senhaForteValidator(new FormControl('abc12345'))).toBeNull();
      expect(senhaForteValidator(new FormControl('abc1234'))).toEqual({ senhaFraca: true });
      expect(senhaForteValidator(new FormControl('abcdefgh'))).toEqual({ senhaFraca: true });
      expect(senhaForteValidator(new FormControl('12345678'))).toEqual({ senhaFraca: true });
    });
  });

  describe('Nome completo', () => {
    it('exige nome e sobrenome', () => {
      expect(nomeCompletoValidator(new FormControl('Maria Silva'))).toBeNull();
      expect(nomeCompletoValidator(new FormControl('Maria'))).toEqual({ nomeIncompleto: true });
    });
  });

  describe('Senhas iguais', () => {
    it('acusa senhas diferentes', () => {
      const g = new FormGroup({ a: new FormControl('x1234567'), b: new FormControl('y1234567') });
      expect(senhasIguaisValidator('a', 'b')(g)).toEqual({ senhasDiferentes: true });
      g.get('b')!.setValue('x1234567');
      expect(senhasIguaisValidator('a', 'b')(g)).toBeNull();
    });
  });
});

describe('Máscaras', () => {
  it('formata CPF', () => {
    expect(aplicarMascara('52998224725', 'cpf')).toBe('529.982.247-25');
    expect(aplicarMascara('5299', 'cpf')).toBe('529.9');
  });
  it('formata telefone de 10 e 11 dígitos', () => {
    expect(aplicarMascara('11912345678', 'telefone')).toBe('(11) 91234-5678');
    expect(aplicarMascara('1112345678', 'telefone')).toBe('(11) 1234-5678');
  });
  it('formata CEP e ignora letras', () => {
    expect(aplicarMascara('01310-100abc', 'cep')).toBe('01310-100');
  });
});
