package br.com.divino.loja.repository;

import br.com.divino.loja.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    /** Native query usada pelo login e pelo reenvio de senha. */
    @Query(value = "SELECT * FROM clientes WHERE email = :email", nativeQuery = true)
    Optional<Cliente> buscarPorEmailNativo(@Param("email") String email);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE clientes SET senha_hash = :hash WHERE id = :id", nativeQuery = true)
    int atualizarSenhaHash(@Param("id") Long id, @Param("hash") String hash);

    boolean existsByEmail(String email);

    boolean existsByCpf(String cpf);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByCpfAndIdNot(String cpf, Long id);

    List<Cliente> findByNomeContainingIgnoreCaseOrderByNome(String nome);
}
