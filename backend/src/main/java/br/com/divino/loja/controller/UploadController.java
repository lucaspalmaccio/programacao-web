package br.com.divino.loja.controller;

import br.com.divino.loja.service.UploadService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final UploadService service;

    public UploadController(UploadService service) {
        this.service = service;
    }

    /** POST /api/uploads/vinhos (multipart, campo "arquivo") — só admin. 201 com a URL pública da foto. */
    @PostMapping("/vinhos")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> enviarFoto(@RequestParam("arquivo") MultipartFile arquivo) {
        String nome = service.salvarFoto(arquivo);
        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/vinhos/").path(nome).toUriString();
        return Map.of("url", url);
    }
}
