package br.com.divino.loja.config;

import br.com.divino.loja.security.AutenticacaoInterceptor;
import br.com.divino.loja.service.UploadService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AutenticacaoInterceptor autenticacao;
    private final UploadService uploads;

    public WebConfig(AutenticacaoInterceptor autenticacao, UploadService uploads) {
        this.autenticacao = autenticacao;
        this.uploads = uploads;
    }

    /** Toda a API exige token, exceto as rotas públicas (ver AutenticacaoInterceptor). */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(autenticacao).addPathPatterns("/api/**");
    }

    /** Serve as fotos enviadas em /uploads/vinhos/{arquivo}. */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String local = uploads.getPasta().getParent().toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(local.endsWith("/") ? local : local + "/");
    }

    /** Libera o front Angular (ng serve) a chamar a API. */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
