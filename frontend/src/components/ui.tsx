import type { ReactNode } from 'react';
import type { Pessoa, Prioridade, Situacao } from '../api/types';
import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  disabled,
  children,
  asChild = false,
  ...props
}: {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  asChild?: boolean;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const Tag = asChild ? ({ children, ...rest }: any) => (
    <span {...rest}>{children}</span>
  ) : 'button';
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  } as Record<string, string>;
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  };
  return (
    <Tag
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Input({
  className,
  type = 'text',
  ...props
}: {
  className?: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: {
  className?: string;
} & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed disabled:opacity-70', className)}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: { className?: string; children: ReactNode }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>;
}


export function SituacaoBadge({ situacao }: { situacao: Situacao }) {
  const colors: Record<Situacao, string> = {
    ABERTO: 'bg-blue-100 text-blue-800 border-blue-200',
    EM_ATENDIMENTO: 'bg-amber-100 text-amber-800 border-amber-200',
    RESOLVIDO: 'bg-green-100 text-green-800 border-green-200',
    FECHADO: 'bg-slate-100 text-slate-800 border-slate-200',
    CANCELADO: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  const labels: Record<Situacao, string> = {
    ABERTO: 'Aberto',
    EM_ATENDIMENTO: 'Em atendimento',
    RESOLVIDO: 'Resolvido',
    FECHADO: 'Fechado',
    CANCELADO: 'Cancelado',
  };
  return (
    <Badge variant="outline" className={colors[situacao]}>
      {labels[situacao]}
    </Badge>
  );
}

export function PrioridadeTag({ prioridade }: { prioridade: Prioridade }) {
  const levels: Record<Prioridade, { label: string; color: string }> = {
    BAIXA: { label: 'Baixa', color: 'bg-green-100 text-green-700' },
    MEDIA: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
    ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
    CRITICA: { label: 'Crítica', color: 'bg-rose-100 text-rose-700' },
  };
  const p = levels[prioridade];
  return (
    <Badge variant="outline" className={p.color} title={`Prioridade ${p.label.toLowerCase()}`}>
      {p.label}
    </Badge>
  );
}

export function Avatar({
  pessoa,
  tamanho = 'md',
}: {
  pessoa: Pessoa | undefined;
  tamanho?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
  if (!pessoa) {
    return (
      <span className={cn('rounded-full bg-muted flex items-center justify-center', sizes[tamanho])}>
        –
      </span>
    );
  }
  const typeColor =
    pessoa.tipo === 'TECNICO' ? 'bg-blue-500/20 text-blue-600' : 'bg-purple-500/20 text-purple-600';
  return (
    <span
      className={cn(
        'rounded-full flex items-center justify-center font-semibold border border-white',
        typeColor,
        sizes[tamanho]
      )}
      title={`${pessoa.nome} (${pessoa.tipo === 'TECNICO' ? 'técnico' : 'solicitante'})`}
    >
      {Iniciais(pessoa.nome)}
    </span>
  );
}

export function Switch({
  className,
  checked,
  onChange,
  label,
  disabled,
  ...props
}: {
  className?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className={cn(
          'peer h-[9px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-full border border-transparent bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
          className
        )}
        disabled={disabled}
        {...props}
      />
      {label && <span className="text-sm text-foreground">{label}</span>}
    </div>
  );
}

export function Campo({
  rotulo,
  dica,
  erro,
  children,
  htmlFor,
}: {
  rotulo: string;
  dica?: ReactNode;
  erro?: string | null;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className={cn('space-y-1', erro && 'text-destructive')}>
      <Label htmlFor={htmlFor}>{rotulo}</Label>
      {children}
      {erro ? (
        <p className="text-xs text-destructive">{erro}</p>
      ) : dica ? (
        <p className="text-xs text-muted-foreground">{dica}</p>
      ) : null}
    </div>
  );
}

export function Vazio({ titulo, descricao, children }: { titulo: string; descricao?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <h3 className="text-lg font-medium">{titulo}</h3>
      {descricao && <p className="text-muted-foreground mt-2">{descricao}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export function Cabecalho({
  kicker,
  titulo,
  children,
}: {
  kicker: string;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <p className="text-xs font-medium text-primary tracking-wider uppercase">{kicker}</p>
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      {children && <div className="mt-2 flex items-center gap-2">{children}</div>}
    </header>
  );
}
export function CardTitle({
  className,
  children,
}: { className?: string; children: ReactNode }) {
  return (
    <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)}>
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
}: { className?: string; children: ReactNode }) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>;
}

export function Badge({
  className,
  variant,
  children,
}: {
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-input',
  } as Record<string, string>;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variants[variant ?? 'default'],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Select({
  className,
  ...props
}: {
  className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Separator({
  className,
  ...props
}: {
  className?: string;
} & React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('border-muted my-4', className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: {
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
