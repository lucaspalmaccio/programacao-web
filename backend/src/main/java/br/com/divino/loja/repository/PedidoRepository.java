package br.com.divino.loja.repository;

import br.com.divino.loja.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Query(value = "SELECT * FROM pedidos WHERE cliente_id = :clienteId ORDER BY id DESC", nativeQuery = true)
    List<Pedido> listarPorCliente(@Param("clienteId") Long clienteId);

    List<Pedido> findAllByOrderByIdDesc();

    boolean existsByClienteId(Long clienteId);
}
