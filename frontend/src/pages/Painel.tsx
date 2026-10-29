import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Chamado, Prioridade, Situacao } from '../api/types';
import {
  Avatar,
  Button,
  Cabecalho,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PrioridadeTag,
  Separator,
  Vazio,
} from '../components/ui';
import { useCadastros } from '../context/Cadastros';
import {
  ORDEM_PRIORIDADES,
  ORDEM_SITUACOES,
  PRIORIDADES,
  SITUACOES,
} from '../lib/dominio';
import { tempoRelativo } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function Painel() {
  const [params, setParams] = useSearchParams();
  const prioridade = (params.get('prioridade') as Prioridade | null) ?? undefined;
  const tipoProblemaId = params.get('tipo') ? Number(params.get('tipo')) : undefined;
  const tecnicoId = params.get('tecnico') ? Number(params.get('tecnico')) : undefined;

  const { pessoa, tipo, tipos, pessoas } = useCadastros();
  const chamados = useAsync(
    () => api.chamados.listar({ prioridade, tipoProblemaId, tecnicoId }),
    [prioridade, tipoProblemaId, tecnicoId],
  );

  const definir = (chave: string, valor: string | null) => {
    const next = new URLSearchParams(params);
    if (valor) next.set(chave, valor);
    else next.delete(chave);
    setParams(next, { replace: true });
  };

  const tecnicos = pessoas.filter((p) => p.tipo === 'TECNICO' && p.ativo);
  const colunas = agrupar(chamados.dados ?? []);
  const total = chamados.dados?.length ?? 0;
  const emAberto = colunas.ABERTO.length + colunas.EM_ATENDIMENTO.length;

  return (
    <div className="pagina animate-fade-in">
      <Cabecalho
        kicker={`${emAberto} em aberto · ${total} no total`}
        titulo="Painel de chamados"
      >
        <Button asChild>
          <a href="/chamados/novo" className="text-sm">
            Abrir chamado
          </a>
        </Button>
      </Cabecalho>

      <div className="filtros grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Prioridade
          </p>
          <div className="flex gap-2">
            <Button
              variant={!prioridade ? 'default' : 'outline'}
              size="sm"
              onClick={() => definir('prioridade', null)}
            >
              Todas
            </Button>
            {ORDEM_PRIORIDADES.map((p) => (
              <Button
                key={p}
                variant={prioridade === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => definir('prioridade', p)}
              >
                {PRIORIDADES[p].rotulo}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Tipo
          </label>
          <select
            value={tipoProblemaId ?? ''}
            onChange={(e) => definir('tipo', e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {!t.ativo ? ' (desativado)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Técnico
          </label>
          <select
            value={tecnicoId ?? ''}
            onChange={(e) => definir('tecnico', e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
          {(prioridade || tipoProblemaId || tecnicoId) && (
            <Button variant="outline" size="sm" onClick={() => setParams({}, { replace: true })}>
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {chamados.erro && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{chamados.erro}</p>
          </CardContent>
        </Card>
      )}

      {!chamados.dados && !chamados.erro && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Carregando chamados…
        </div>
      )}

      {chamados.dados && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {ORDEM_SITUACOES.map((s) => (
            <Card key={s} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{SITUACOES[s].rotulo}</CardTitle>
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {colunas[s].length}
                  </span>
                </div>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">{SITUACOES[s].resumo}</p>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto min-h-[300px]">
                {colunas[s].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum chamado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {colunas[s].map((c) => (
                      <a
                        key={c.id}
                        href={`/chamados/${c.id}`}
                        className="block cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <Card className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono text-muted-foreground">
                                #{String(c.id).padStart(4, '0')}
                              </span>
                              <PrioridadeTag prioridade={c.prioridade} />
                            </div>
                            <time className="text-xs text-muted-foreground">
                              {tempoRelativo(c.criadoEm)}
                            </time>
                          </div>
                          <h4 className="font-semibold line-clamp-1 mb-1">{c.titulo}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {tipo(c.tipoProblemaId)?.nome ?? 'Tipo removido'}
                          </p>
                          <div className="flex items-center gap-2">
                            {c.tecnicoId ? (
                              <Avatar pessoa={pessoa(c.tecnicoId)} tamanho="sm" />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                –
                              </span>
                            )}
                            <span className="text-xs font-medium truncate">
                              {c.tecnicoId ? pessoa(c.tecnicoId)?.nome : 'Sem técnico'}
                            </span>
                          </div>
                        </Card>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {chamados.dados && total === 0 && (
        <Vazio
          titulo="Nenhum chamado com esses filtros."
          descricao="Tente limpar os filtros ou abrir o primeiro chamado."
        >
          <Button asChild>
            <a href="/chamados/novo" className="text-sm">
              Abrir o primeiro chamado
            </a>
          </Button>
        </Vazio>
      )}
    </div>
  );
}

function agrupar(lista: Chamado[]): Record<Situacao, Chamado[]> {
  const colunas: Record<Situacao, Chamado[]> = {
    ABERTO: [],
    EM_ATENDIMENTO: [],
    RESOLVIDO: [],
    FECHADO: [],
    CANCELADO: [],
  };
  for (const c of [...lista].reverse()) colunas[c.situacao].push(c);
  return colunas;
}
