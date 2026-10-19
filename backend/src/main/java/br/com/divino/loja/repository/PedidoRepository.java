package br.com.divino.loja.repository;

import br.com.divino.loja.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByClienteIdOrderByIdDesc(Long clienteId);

    List<Pedido> findAllByOrderByIdDesc();

    boolean existsByClienteId(Long clienteId);
}
