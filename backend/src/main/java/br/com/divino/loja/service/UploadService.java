package br.com.divino.loja.service;

import br.com.divino.loja.exception.ArquivoInvalidoException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/** Guarda fotos de vinhos em disco. O tipo é decidido pelo conteúdo do arquivo, não pelo nome nem pelo Content-Type. */
@Service
public class UploadService {

    private final Path pasta;

    public UploadService(@Value("${divino.upload-dir:./uploads}") String diretorio) {
        this.pasta = Paths.get(diretorio).toAbsolutePath().normalize().resolve("vinhos");
    }

    /** Salva a foto e devolve o nome do arquivo gerado (ex.: 3f2a...png). */
    public String salvarFoto(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ArquivoInvalidoException("Selecione uma imagem.");
        }
        try {
            byte[] bytes = arquivo.getBytes();
            String extensao = detectarExtensao(bytes);
            if (extensao == null) {
                throw new ArquivoInvalidoException("Formato não suportado. Envie uma imagem PNG, JPG ou WEBP.");
            }
            Files.createDirectories(pasta);
            String nome = UUID.randomUUID() + "." + extensao;
            Files.write(pasta.resolve(nome), bytes);
            return nome;
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao gravar o arquivo.", e);
        }
    }

    public Path getPasta() {
        return pasta;
    }

    private static String detectarExtensao(byte[] b) {
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return "png";
        }
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "webp";
        }
        return null;
    }
}
