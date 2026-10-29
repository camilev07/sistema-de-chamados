import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Prioridade } from '../api/types';
import {
  Button,
  Campo,
  Cabecalho,
  Input,
  Select,
  TextArea,
  Vazio,
} from '../components/ui';
import { useCadastros } from '../context/Cadastros';
import { useToast } from '../context/Toast';
import { DESCRICAO_MIN, ORDEM_PRIORIDADES, PRIORIDADES, TITULO } from '../lib/dominio';

export function NovoChamado() {
  const navigate = useNavigate();
  const toast = useToast();
  const { pessoas, tipos, recarregar } = useCadastros();

  const solicitantes = pessoas.filter((p) => p.tipo === 'SOLICITANTE' && p.ativo);
  const tiposAtivos = tipos.filter((t) => t.ativo);

  const [solicitanteId, setSolicitanteId] = useState<string>('');
  const [tipoProblemaId, setTipoProblemaId] = useState<string>('');
  const [prioridade, setPrioridade] = useState<Prioridade>('MEDIA');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const tituloLen = titulo.trim().length;
  const descLen = descricao.trim().length;

  const erros = {
    solicitante: solicitanteId === '' ? 'Escolha quem está pedindo ajuda.' : null,
    tipo: tipoProblemaId === '' ? 'Escolha o tipo do problema.' : null,
    titulo:
      tituloLen < TITULO.min
        ? `Use pelo menos ${TITULO.min} caracteres.`
        : tituloLen > TITULO.max
          ? `Limite de ${TITULO.max} caracteres.`
          : null,
    descricao: descLen < DESCRICAO_MIN ? `Descreva com pelo menos ${DESCRICAO_MIN} caracteres.` : null,
  };
  const valido = Object.values(erros).every((e) => e === null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);
    setErroServidor(null);
    if (!valido || solicitanteId === '' || tipoProblemaId === '') return;

    setEnviando(true);
    try {
      const chamado = await api.chamados.criar({
        solicitanteId: Number(solicitanteId),
        tipoProblemaId: Number(tipoProblemaId),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        prioridade,
      });
      toast.ok(`Chamado #${String(chamado.id).padStart(4, '0')} aberto.`);
      navigate(`/chamados/${chamado.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Não foi possível abrir o chamado.';
      setErroServidor(msg);
      if (err instanceof ApiError && err.status === 404) recarregar();
    } finally {
      setEnviando(false);
    }
  }

  if (solicitantes.length === 0 || tiposAtivos.length === 0) {
    return (
      <div className="pagina">
        <Cabecalho kicker="Novo chamado" titulo="Antes de abrir, faltam cadastros" />
        <Vazio
          titulo="Para abrir um chamado é preciso ter ao menos:"
          descricao="Cadastre as pessoas e tipos necessários antes de continuar."
        >
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mt-4">
            {solicitantes.length === 0 && (
              <li>
                um solicitante ativo —{' '}
                <a href="/pessoas" className="text-primary hover:underline">
                  cadastrar pessoa
                </a>
              </li>
            )}
            {tiposAtivos.length === 0 && (
              <li>
                um tipo de problema ativo —{' '}
                <a href="/tipos" className="text-primary hover:underline">
                  cadastrar tipo
                </a>
              </li>
            )}
          </ul>
        </Vazio>
      </div>
    );
  }

  return (
    <div className="pagina pagina-estreita">
      <Cabecalho kicker="Novo chamado" titulo="Abrir chamado" />

      <form className="space-y-6" onSubmit={enviar}>
        <Campo
          rotulo="Solicitante"
          dica="Quem está pedindo ajuda."
          erro={tentou ? erros.solicitante : null}
        >
          <Select
            value={solicitanteId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSolicitanteId(e.target.value)}
            className="w-full"
          >
            <option value="">Selecione…</option>
            {solicitantes.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.nome}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo
          rotulo="Tipo do problema"
          dica="A categoria do chamado."
          erro={tentou ? erros.tipo : null}
        >
          <Select
            value={tipoProblemaId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipoProblemaId(e.target.value)}
            className="w-full"
          >
            <option value="">Selecione…</option>
            {tiposAtivos.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.nome}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo rotulo="Urgência" dica="Quanto mais alta, mais rápido o chamado sobe na fila do técnico.">
          <div className="flex gap-2" role="radiogroup" aria-label="Prioridade">
            {ORDEM_PRIORIDADES.map((p) => (
              <Button
                key={p}
                variant={prioridade === p ? 'default' : 'outline'}
                size="sm"
                role="radio"
                aria-checked={prioridade === p}
                onClick={() => setPrioridade(p)}
                className="flex-1 text-xs md:text-sm"
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {[1, 2, 3, 4].map((n) => (
                      <span
                        key={n}
                        className={
                          n <= PRIORIDADES[p].nivel
                            ? 'bg-current opacity-80'
                            : 'bg-current opacity-20'
                        }
                      />
                    ))}
                  </div>
                  <span>{PRIORIDADES[p].rotulo}</span>
                </div>
              </Button>
            ))}
          </div>
        </Campo>

        <Campo
          rotulo="Título"
          erro={tentou ? erros.titulo : null}
          dica={
            <span className="text-xs text-muted-foreground">
              {tituloLen}/{TITULO.max} caracteres
            </span>
          }
        >
          <Input
            id="titulo"
            value={titulo}
            maxLength={TITULO.max + 20}
            placeholder="Ex.: Sem internet no setor 3"
            onChange={(e) => setTitulo(e.target.value)}
            autoFocus
          />
        </Campo>

        <Campo
          rotulo="O que está acontecendo"
          erro={tentou ? erros.descricao : null}
          dica={
            <span className="text-xs text-muted-foreground">
              {descLen} caracteres
            </span>
          }
        >
          <TextArea
            id="descricao"
            rows={6}
            value={descricao}
            placeholder="Quando começou, o que já foi tentado, o que aparece na tela…"
            onChange={(e) => setDescricao(e.target.value)}
          />
        </Campo>

        {erroServidor && (
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {erroServidor}
          </div>
        )}

        <footer className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" asChild>
            <a href="/chamados" className="text-sm">
              Cancelar
            </a>
          </Button>
          <Button type="submit" disabled={enviando || !valido}>
            {enviando ? 'Abrindo…' : 'Abrir chamado'}
          </Button>
        </footer>
      </form>
    </div>
  );
}
