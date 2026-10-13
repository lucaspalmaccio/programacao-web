package br.com.divino.loja.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDate;
import java.time.Period;

/** Venda de bebida alcoólica: o cliente precisa ter 18 anos ou mais. */
@Documented
@Constraint(validatedBy = Maioridade.Validador.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface Maioridade {

    String message() default "É necessário ter 18 anos ou mais";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validador implements ConstraintValidator<Maioridade, LocalDate> {

        @Override
        public boolean isValid(LocalDate nascimento, ConstraintValidatorContext context) {
            return nascimento == null || Period.between(nascimento, LocalDate.now()).getYears() >= 18;
        }
    }
}
