# Di Vino — API (Spring Boot)

API REST de clientes da loja de vinhos. Java 17+, Spring Boot 3, Spring Data JPA, H2, Bean Validation.

## Rodar

Não precisa instalar o Maven (usa o wrapper). Só o JDK 17+.

```bash
cd backend
./mvnw spring-boot:run     # Windows: mvnw.cmd spring-boot:run   → http://localhost:8080
./mvnw test                # 15 testes
```

Banco H2 em arquivo (`backend/data/`, ignorado pelo git): os dados sobrevivem ao reiniciar.
Console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:file:./data/divino`, usuário `sa`, senha vazia).

## Endpoints — `/api/clientes`

| Método | Rota | Respostas |
|---|---|---|
| GET | `/api/clientes?nome=` | 200 lista (filtro opcional por nome) |
| GET | `/api/clientes/{id}` | 200 / 404 |
| POST | `/api/clientes` | 201 + `Location` / 400 / 409 |
| PUT | `/api/clientes/{id}` | 200 / 400 / 404 / 409 |
| DELETE | `/api/clientes/{id}` | 204 / 404 |
| POST | `/api/clientes/login` | 200 (cliente) / 400 / 401 |
| POST | `/api/clientes/reenviar-senha` | 204 sempre (gera senha temporária via native query; envio simulado no log) / 400 |
| PUT | `/api/clientes/{id}/senha` | 204 / 400 / 401 (senha atual errada) / 404 |

Exemplo de POST:

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "cpf": "529.982.247-25",
  "telefone": "(11) 91234-5678",
  "nascimento": "1990-05-20",
  "senha": "segredo123",
  "endereco": { "cep": "01001-000", "endereco": "Praça da Sé", "numero": "10", "cidade": "São Paulo", "uf": "SP" }
}
```

Regras:
- PUT: `senha` e `endereco` são opcionais; ausentes, mantêm o valor atual.
- E-mail é gravado em minúsculas; CPF, telefone e CEP só com dígitos; UF em maiúsculas.
- Senha guardada com BCrypt e nunca devolvida.
- Erros de validação voltam em 400 com `campos` indicando cada campo inválido.
- O login só confere credenciais; não emite token/sessão (autenticação das demais rotas fica fora do escopo).

## Endpoints — `/api/pedidos`

| Método | Rota | Respostas |
|---|---|---|
| GET | `/api/pedidos?clienteId=` | 200 lista (mais recentes primeiro) |
| GET | `/api/pedidos/{id}` | 200 / 404 |
| POST | `/api/pedidos` | 201 + `Location` / 400 / 404 (cliente inexistente) |
| PUT | `/api/pedidos/{id}/status` | 200 / 400 / 404 |

Subtotal e total são calculados no servidor a partir dos itens. Excluir um cliente que tem pedidos devolve 409.

## Endpoints — `/api/produtos`

| Método | Rota | Respostas |
|---|---|---|
| GET | `/api/produtos?busca=` | 200 lista (com `busca`, usa native query em nome, tipo, país, região e uva) |
| GET | `/api/produtos/{id}` | 200 / 404 |
| POST | `/api/produtos` | 201 + `Location` / 400 |
| PUT | `/api/produtos/{id}` | 200 / 400 / 404 |
| DELETE | `/api/produtos/{id}` | 204 / 404 |

O catálogo inicial (13 vinhos) vem de `src/main/resources/produtos-seed.json` e é cadastrado na primeira subida, quando a tabela está vazia.

## MySQL (opcional)

Por padrão usa H2. Para MySQL (`localhost:3306`, banco `divino`, ajuste usuário/senha em `application-mysql.properties`):

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql
```

