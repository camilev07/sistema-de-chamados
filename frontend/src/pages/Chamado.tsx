import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ChamadoDetalhe, Pessoa, Situacao } from '../api/types';
import {
  Avatar,
  Badge,
  Button,
  Cabecalho,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  PrioridadeTag,
  Separator,
  TextArea,
  Vazio,
} from '../components/ui';
import { useCadastros } from '../context/Cadastros';
import { useToast } from '../context/Toast';
import { ENCERRADO, LIMITE_EM_ATENDIMENTO, SITUACOES, TRANSICOES } from '../lib/dominio';
import { codigo, formatarData } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const ACAO: Partial<Record<Situacao, { rotulo: string; desc: string; confirma?: string }>> = {
  EM_ATENDIMENTO: { rotulo: 'Reabrir atendimento', desc: 'Volta para o mesmo técnico.' },
  RESOLVIDO: { rotulo: 'Marcar como resolvido', desc: 'Registra a data da resolução.' },
  FECHADO: {
    rotulo: 'Fechar chamado',
    desc: 'Encerra de vez. Não aceita mais comentários.',
    confirma: 'Fechar o chamado? Ele não poderá mais ser alterado.',
  },
  CANCELADO: {
    rotulo: 'Cancelar chamado',
    desc: 'Encerra sem solução.',
    confirma: 'Cancelar o chamado? Essa ação encerra o chamado.',
  },
};

export function Chamado() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const { pessoas } = useCadastros();

  const detalhe = useAsync(() => api.chamados.buscar(id), [id]);
  const emAtendimento = useAsync(() => api.chamados.listar({ situacao: 'EM_ATENDIMENTO' }), [id]);

  const cargas = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const c of emAtendimento.dados ?? []) {
      if (c.tecnicoId) mapa.set(c.tecnicoId, (mapa.get(c.tecnicoId) ?? 0) + 1);
    }
    return mapa;
  }, [emAtendimento.dados]);

  if (detalhe.erro) {
    return (
      <div className="pagina py-6">
        <Vazio titulo={detalhe.erro} descricao="Não foi possível carregar os dados do chamado.">
          <Button asChild>
            <a href="/chamados" className="text-sm">
              Voltar ao painel
            </a>
          </Button>
        </Vazio>
      </div>
    );
  }
  if (!detalhe.dados) {
    return <div className="pagina py-6 flex items-center justify-center text-muted-foreground">
      Carregando chamado…
    </div>;
  }

  const c = detalhe.dados;
  const recarregar = () => {
    detalhe.recarregar();
    emAtendimento.recarregar();
  };

  const tecnicos = pessoas.filter((p) => p.tipo === 'TECNICO' && p.ativo);

  return (
    <div className="pagina py-6">
      <a href="/chamados" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
        ← Painel
      </a>

      <Cabecalho
        kicker={`Chamado ${codigo(c.id)} · ${c.tipoProblema.nome}`}
        titulo={c.titulo}
      >
        <div className="flex items-center gap-2">
          <Badge variant={c.situacao === 'FECHADO' || c.situacao === 'CANCELADO' ? 'secondary' : 'default'} className="text-xs">
            {c.situacao === 'ABERTO' ? 'Aberto' : c.situacao === 'EM_ATENDIMENTO' ? 'Em atendimento' : c.situacao === 'RESOLVIDO' ? 'Resolvido' : c.situacao === 'FECHADO' ? 'Fechado' : 'Cancelado'}
          </Badge>
          <PrioridadeTag prioridade={c.prioridade} />
        </div>
      </Cabecalho>

      <Trilha situacao={c.situacao} resolvidoEm={c.resolvidoEm} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Descrição</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{c.descricao}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Aberto por <strong>{c.solicitante.nome}</strong> em {formatarData(c.criadoEm)}
              </p>
            </CardContent>
          </Card>

          <Conversa chamado={c} onComentou={recarregar} />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Responsável</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar pessoa={c.solicitante} tamanho="md" />
                <div>
                  <div className="text-xs text-muted-foreground">Solicitante</div>
                  <div className="text-sm font-medium">{c.solicitante.nome}</div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                {c.tecnicoId ? (
                  <>
                    <Avatar pessoa={c.tecnico ?? undefined} tamanho="md" />
                    <div>
                      <div className="text-xs text-muted-foreground">Técnico</div>
                      <div className="text-sm font-medium">{c.tecnico?.nome}</div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-muted-foreground">Técnico</div>
                    <div className="text-sm font-medium text-muted-foreground">Ainda sem técnico</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {c.situacao === 'ABERTO' && !c.tecnicoId && (
            <Designar
              chamado={c}
              tecnicos={tecnicos.filter((t) => t.id !== c.solicitanteId)}
              cargas={cargas}
              onDesignado={recarregar}
            />
          )}

          <Acoes chamado={c} cargas={cargas} onMudou={recarregar} />
        </aside>
      </div>
    </div>
  );
}

function Trilha({ situacao, resolvidoEm }: { situacao: Situacao; resolvidoEm: string | null }) {
  const ordem = ['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO', 'FECHADO', 'CANCELADO'];
  const atual = ordem.indexOf(situacao);

  return (
    <div className="flex items-center gap-2 mb-6">
      {ordem.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          {i > 0 && (
            <div className={`w-4 h-0.5 ${i <= atual ? 'bg-primary' : 'bg-muted'}`} />
          )}
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border',
              i <= atual ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-muted',
            )}
          >
            {i + 1}
          </div>
          <span className={cn('text-xs font-medium', i <= atual ? 'text-foreground' : 'text-muted-foreground')}>
            {SITUACOES[s as Situacao].rotulo}
          </span>
        </div>
      ))}
      {resolvidoEm && (
        <span className="ml-4 text-xs text-muted-foreground">
          Resolvido em {formatarData(resolvidoEm)}
        </span>
      )}
    </div>
  );
}

function Conversa({
  chamado,
  onComentou,
}: {
  chamado: ChamadoDetalhe;
  onComentou: () => void;
}) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { pessoas } = useCadastros();
  const toast = useToast();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    const autorId = chamado.solicitanteId;
    setEnviando(true);
    try {
      await api.chamados.comentar(chamado.id, autorId, texto.trim());
      setTexto('');
      onComentou();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Não foi possível enviar o comentário.';
      toast.erro(msg);
    } finally {
      setEnviando(false);
    }
  }

  const podeComentar = !ENCERRADO(chamado.situacao);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Conversa</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {chamado.comentarios.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Ainda não há comentários neste chamado.
          </p>
        ) : (
          chamado.comentarios.map((comentario) => {
            const autor = pessoas.find((p) => p.id === comentario.autorId);
            return (
              <div key={comentario.id} className="flex gap-3">
                <Avatar pessoa={autor} tamanho="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{autor?.nome ?? '—'}</span>
                    <time className="text-xs text-muted-foreground">
                      {formatarData(comentario.criadoEm)}
                    </time>
                  </div>
                  <p className="text-sm text-foreground mt-1">{comentario.texto}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
      <CardContent className="p-3 pt-2">
        <form onSubmit={enviar} className="flex gap-2">
          <TextArea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            placeholder={podeComentar ? 'Escreva um comentário…' : 'Chamado encerrado.'}
            disabled={!podeComentar}
            className="flex-1"
          />
          <Button type="submit" disabled={enviando || !texto.trim() || !podeComentar}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Designar({
  chamado,
  tecnicos,
  cargas,
  onDesignado,
}: {
  chamado: ChamadoDetalhe;
  tecnicos: Pessoa[];
  cargas: Map<number, number>;
  onDesignado: () => void;
}) {
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const toast = useToast();

  async function designar() {
    if (escolhido === null) return;
    setEnviando(true);
    try {
      await api.chamados.designar(chamado.id, escolhido);
      onDesignado();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Não foi possível designar o técnico.';
      toast.erro(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Designar técnico</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {tecnicos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum técnico ativo disponível.
          </p>
        )}
        <div role="radiogroup" aria-label="Técnicos" className="space-y-2">
          {tecnicos.map((t) => {
            const carga = cargas.get(t.id) ?? 0;
            const lotado = carga >= LIMITE_EM_ATENDIMENTO;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={escolhido === t.id}
                disabled={lotado}
                onClick={() => setEscolhido(t.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors',
                  escolhido === t.id
                    ? 'border-primary bg-primary/5 text-primary-foreground'
                    : 'border-muted hover:bg-muted text-foreground/70',
                )}
              >
                <Avatar pessoa={t} tamanho="sm" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{t.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {carga}/{LIMITE_EM_ATENDIMENTO} em atendimento
                  </div>
                </div>
                {lotado && <span className="text-xs text-destructive">Lotado</span>}
              </button>
            );
          })}
        </div>
        <footer className="pt-2 flex justify-end">
          <Button
            type="button"
            disabled={escolhido === null || enviando}
            onClick={designar}
          >
            {enviando ? 'Designando…' : 'Confirmar designação'}
          </Button>
        </footer>
      </CardContent>
    </Card>
  );
}

function Acoes({
  chamado,
  cargas,
  onMudou,
}: {
  chamado: ChamadoDetalhe;
  cargas: Map<number, number>;
  onMudou: () => void;
}) {
  const proximas = TRANSICOES[chamado.situacao];

  if (proximas.length === 0) return null;

  const cargaTecnico = chamado.tecnicoId ? (cargas.get(chamado.tecnicoId) ?? 0) : 0;
  const lotadoParaReabrir = cargaTecnico >= LIMITE_EM_ATENDIMENTO;

  async function mudar(nova: Situacao) {
    const acao = ACAO[nova];
    if (acao?.confirma && !window.confirm(acao.confirma)) return;
    setEnviando(nova);
    try {
      await api.chamados.mudarSituacao(chamado.id, nova);
      toast.ok(`Situação: ${SITUACOES[nova].rotulo}.`);
      onMudou();
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Não foi possível mudar a situação.');
    } finally {
      setEnviando(null);
    }
  }

  const [enviando, setEnviando] = useState<Situacao | null>(null);
  const toast = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Próximo passo</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {proximas.map((nova) => {
          const acao = ACAO[nova]!;
          const bloqueado = nova === 'EM_ATENDIMENTO' && lotadoParaReabrir;
          return (
            <button
              key={nova}
              type="button"
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-colors text-left',
                bloqueado
                  ? 'border-destructive/50 bg-destructive/5 text-destructive cursor-not-allowed'
                  : enviando === nova
                    ? 'border-primary bg-primary/5 text-primary-foreground'
                    : 'border-muted hover:bg-muted text-foreground/70',
              )}
              disabled={bloqueado || enviando !== null}
              onClick={() => mudar(nova)}
            >
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="font-medium">
                    {enviando === nova ? 'Aplicando…' : acao.rotulo}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {bloqueado ? 'Lotado' : acao.desc}
                  </span>
                </div>
                {bloqueado && (
                  <p className="text-xs text-destructive mt-1">
                    Técnico já tem {LIMITE_EM_ATENDIMENTO} chamados em atendimento.
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
