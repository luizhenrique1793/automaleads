import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CalendarDays, CheckSquare, FolderKanban, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/primitives";

export const Route = createFileRoute("/_shell/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda · Automa Gestão" },
      {
        name: "description",
        content: "Guia prático de uso: empresas, projetos, ações e tarefas do dia a dia.",
      },
      { property: "og:title", content: "Ajuda · Automa Gestão" },
      {
        property: "og:description",
        content: "Guia prático de uso: empresas, projetos, ações e tarefas do dia a dia.",
      },
    ],
  }),
  component: HelpPage,
});

const CONCEPTS = [
  {
    icon: Building2,
    title: "Empresa",
    text: "É o cliente que você atende. Tudo no sistema pertence a uma empresa.",
    example: "Exemplo: Parque Pôr do Sol.",
  },
  {
    icon: FolderKanban,
    title: "Projeto",
    text: "Um trabalho maior, com começo e fim, dentro de uma empresa. É opcional.",
    example: "Exemplo: Novo site, Agente de IA, Campanha de setembro.",
  },
  {
    icon: Sparkles,
    title: "Ação",
    text: "Um compromisso que acontece em uma data e horário: reunião, treinamento, visita, entrega.",
    example: "Exemplo: Reunião de validação, 15/09 das 14:00 às 15:00.",
  },
  {
    icon: CheckSquare,
    title: "Tarefa",
    text: "Um trabalho que alguém precisa executar até um prazo.",
    example: "Exemplo: Preparar apresentação, prazo 14/09, responsável Adriana.",
  },
];

const STEPS = [
  {
    title: "1. Cadastre suas empresas",
    text: "Vá em Empresas e clique em Nova empresa. Dê um nome e escolha uma cor — essa cor identifica o cliente em todas as telas.",
  },
  {
    title: "2. Crie os projetos (quando houver)",
    text: "Dentro da empresa, clique em Novo projeto. Se o trabalho for solto, você pode criar tarefas sem projeto.",
  },
  {
    title: "3. Registre as ações da agenda",
    text: "Reuniões, treinamentos, palestras e entregas com data. Marque Dia inteiro ou informe o horário de início e fim.",
  },
  {
    title: "4. Crie tarefas com prazo e responsável",
    text: "Use o botão Criar no topo. Ao criar a partir da página de uma empresa ou projeto, esses campos já vêm preenchidos.",
  },
];

const FAQ = [
  {
    q: "Qual a diferença entre ação e tarefa?",
    a: "Ação é compromisso com data e hora (aparece na agenda). Tarefa é trabalho a entregar até um prazo (aparece na sua lista).",
  },
  {
    q: "O que significa tarefa atrasada?",
    a: "É uma tarefa cujo prazo já passou e que ainda não foi concluída nem cancelada. Ela aparece destacada em vermelho.",
  },
  {
    q: "O que é Aguardando cliente?",
    a: "Use esse status quando o trabalho depende de uma resposta ou material do cliente. Assim ele não conta como atraso da equipe.",
  },
  {
    q: "Como concluo uma tarefa?",
    a: "Clique na caixinha ao lado do título. A lista e os números do Início se atualizam na hora.",
  },
  {
    q: "Onde vejo o meu dia?",
    a: "Em Início você vê o que precisa resolver agora. Em Minha semana vê de segunda a domingo. No Calendário vê o mês inteiro.",
  },
  {
    q: "Como troco minha senha?",
    a: "No menu lateral, em Minha conta.",
  },
];

function HelpPage() {
  return (
    <>
      <PageHeader
        title="Ajuda"
        subtitle="Um guia rápido para usar o sistema no dia a dia, sem complicação."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold">Os quatro conceitos do sistema</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONCEPTS.map(({ icon: Icon, title, text, example }) => (
            <div key={title} className="card-surface p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                <h3 className="text-sm font-bold">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{text}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">{example}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold">Como começar em 4 passos</h2>
        <ol className="card-surface divide-y divide-border">
          {STEPS.map((s) => (
            <li key={s.title} className="px-4 py-3">
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link to="/empresas" className="font-semibold text-primary hover:underline">
            Ir para Empresas
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/tarefas" className="font-semibold text-primary hover:underline">
            Ir para Tarefas
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold">As telas do dia a dia</h2>
        <div className="card-surface divide-y divide-border">
          <div className="px-4 py-3">
            <p className="text-sm font-semibold">Início</p>
            <p className="text-sm text-muted-foreground">
              Responde “o que preciso resolver agora?”: tarefas de hoje, atrasadas, ações da semana
              e o que está aguardando cliente.
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold">Minha semana</p>
            <p className="text-sm text-muted-foreground">
              Segunda a domingo, com os compromissos e os prazos de cada dia.
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <CalendarDays className="size-3.5" /> Calendário
            </p>
            <p className="text-sm text-muted-foreground">
              Visão de semana ou de mês. Ações aparecem com horário; tarefas aparecem com o ícone de
              checklist.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold">Perguntas frequentes</h2>
        <div className="card-surface divide-y divide-border">
          {FAQ.map((f) => (
            <div key={f.q} className="px-4 py-3">
              <p className="text-sm font-semibold">{f.q}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
