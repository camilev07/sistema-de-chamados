import {
  NavLink,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { CadastrosProvider, useCadastros } from './context/Cadastros';
import { ToastProvider } from './context/Toast';
import { Painel } from './pages/Painel';
import { NovoChamado } from './pages/NovoChamado';
import { Chamado } from './pages/Chamado';
import { Pessoas } from './pages/Pessoas';
import { Tipos } from './pages/Tipos';
import { Button } from './components/ui';
import { Vazio } from './components/ui';
import './index.css';

export function App() {
  return (
    <ToastProvider>
      <CadastrosProvider>
        <Shell />
      </CadastrosProvider>
    </ToastProvider>
  );
}

function Shell() {
  const { pessoas, tipos } = useCadastros();
  const ativos = pessoas.filter((p) => p.ativo).length;
  const tiposAtivos = tipos.filter((t) => t.ativo).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-r border-border bg-background shrink-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              §
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Mesa de Chamados</div>
              <div className="text-xs text-muted-foreground">suporte interno</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <NavLink
            to="/chamados"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">
              01
            </span>
            Painel
          </NavLink>
          <NavLink
            to="/chamados/novo"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">
              02
            </span>
            Abrir chamado
          </NavLink>
          <NavLink
            to="/pessoas"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">
              03
            </span>
            Pessoas
            <span className="ml-auto px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground font-medium">
              {ativos}
            </span>
          </NavLink>
          <NavLink
            to="/tipos"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">
              04
            </span>
            Tipos de problema
            <span className="ml-auto px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground font-medium">
              {tiposAtivos}
            </span>
          </NavLink>
        </nav>

        <div className="p-6 text-xs text-muted-foreground text-center border-t border-border">
          Cada chamado tem um responsável, uma conversa e um ciclo de vida.
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/chamados" replace />} />
            <Route path="/chamados" element={<Painel />} />
            <Route path="/chamados/novo" element={<NovoChamado />} />
            <Route path="/chamados/:id" element={<Chamado />} />
            <Route path="/pessoas" element={<Pessoas />} />
            <Route path="/tipos" element={<Tipos />} />
            <Route
              path="*"
              element={
                <Vazio
                  titulo="Esta página não existe."
                  descricao="O caminho que você tentou acessar não foi encontrado."
                >
                  <Button asChild>
                    <NavLink to="/chamados">Voltar ao painel</NavLink>
                  </Button>
                </Vazio>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
