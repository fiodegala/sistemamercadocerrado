import { brl } from '../api.js';
import { LOJA } from '../config.js';

const PAGAMENTO_LABEL = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Cartão de débito', credito: 'Cartão de crédito' };

// Cupom (recibo não fiscal) de uma venda. Renderiza dentro de um modal e
// pode ser impresso — o CSS de impressão isola apenas o .cupom-print.
export default function Cupom({ venda, onFechar }) {
  if (!venda) return null;
  const itens = venda.itens || [];

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal cupom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cupom-print">
          <div className="cupom-header">
            <strong>{LOJA.nome}</strong>
            <div>{LOJA.slogan}</div>
            <div>CNPJ: {LOJA.cnpj}</div>
            <div>{LOJA.endereco}</div>
            <div>Tel: {LOJA.telefone}</div>
          </div>

          <div className="cupom-linha" />
          <div className="cupom-meta">
            <div>CUPOM NÃO FISCAL</div>
            <div>Venda #{venda.id}</div>
            <div>{venda.criado_em}</div>
          </div>
          <div className="cupom-linha" />

          <table className="cupom-itens">
            <thead>
              <tr><th>Item</th><th className="num">Qtd</th><th className="num">Unit.</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id}>
                  <td>{i.descricao}</td>
                  <td className="num">{i.quantidade}</td>
                  <td className="num">{brl(i.preco_unitario)}</td>
                  <td className="num">{brl(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cupom-linha" />
          <div className="cupom-totais">
            <div><span>Subtotal</span><span>{brl(venda.subtotal)}</span></div>
            {venda.desconto > 0 && <div><span>Desconto</span><span>- {brl(venda.desconto)}</span></div>}
            <div className="cupom-total"><span>TOTAL</span><span>{brl(venda.total)}</span></div>
            <div><span>Pagamento</span><span>{PAGAMENTO_LABEL[venda.forma_pagamento] || venda.forma_pagamento}</span></div>
          </div>
          <div className="cupom-linha" />
          <div className="cupom-rodape">
            Obrigado pela preferência!<br />
            {LOJA.nome}
          </div>
        </div>

        <div className="modal-actions nao-imprimir">
          <button className="btn secundario" onClick={onFechar}>Fechar</button>
          <button className="btn" onClick={() => window.print()}>🖨️ Imprimir cupom</button>
        </div>
      </div>
    </div>
  );
}
