package br.com.divino.loja;

import br.com.divino.loja.validation.CpfValidator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CpfValidatorTest {

    @Test
    void aceitaCpfsValidosComEmMascara() {
        assertTrue(CpfValidator.validar("529.982.247-25"));
        assertTrue(CpfValidator.validar("52998224725"));
        assertTrue(CpfValidator.validar("168.995.350-09"));
        assertTrue(CpfValidator.validar("111.444.777-35"));
    }

    @Test
    void rejeitaCpfsInvalidos() {
        assertFalse(CpfValidator.validar("111.111.111-11"));
        assertFalse(CpfValidator.validar("529.982.247-24"));
        assertFalse(CpfValidator.validar("123"));
        assertFalse(CpfValidator.validar("abc"));
    }
}
