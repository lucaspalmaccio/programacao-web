package br.com.divino.loja.config;

import br.com.divino.loja.security.AdminInterceptor;
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

    private final AdminInterceptor adminInterceptor;
    private final UploadService uploads;

    public WebConfig(AdminInterceptor adminInterceptor, UploadService uploads) {
        this.adminInterceptor = adminInterceptor;
        this.uploads = uploads;
    }

    /** Escrita no catálogo e upload de fotos só para administradores. */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminInterceptor).addPathPatterns("/api/produtos/**", "/api/uploads/**");
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
