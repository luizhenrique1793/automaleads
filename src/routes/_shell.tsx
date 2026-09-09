import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  Building2,
  FolderKanban,
  CheckSquare,
  Sparkles,
  LayoutDashboard,
  Users,
  Plus,
  Menu,
  LogOut,
  HelpCircle,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { completeOnboarding, getMe, logout } from "@/lib/api.functions";
import { FormsProvider, useForms } from "@/components/app/forms";
import { isAdmin } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell")({
  beforeLoad: async ({ location }) => {
    const res = await getMe();
    if (!res.user) throw redirect({ to: "/login" });
    if (res.user.must_change_password && location.pathname !== "/conta") {
      throw redirect({ to: "/conta" });
    }
    if (res.user.global_role === "cliente" && location.pathname !== "/conta") {
      throw redirect({ to: "/portal", search: { aba: "painel", dia: undefined } });
    }
    return { user: res.user };
  },
  component: ShellLayout,
});

const NAV = [
  { to: "/", label: "Início", icon: LayoutDashboard, exact: true, adminOnly: false },
  { to: "/semana", label: "Minha semana", icon: CalendarRange, exact: false, adminOnly: false },
  { to: "/calendario", label: "Calendário", icon: CalendarDays, exact: false, adminOnly: false },
  { to: "/empresas", label: "Empresas", icon: Building2, exact: false, adminOnly: false },
  { to: "/projetos", label: "Projetos", icon: FolderKanban, exact: false, adminOnly: false },
  { to: "/tarefas", label: "Tarefas", icon: CheckSquare, exact: false, adminOnly: false },
  { to: "/acoes", label: "Ações", icon: Sparkles, exact: false, adminOnly: false },
  { to: "/usuarios", label: "Usuários", icon: Users, exact: false, adminOnly: true },
  { to: "/ajuda", label: "Ajuda", icon: HelpCircle, exact: false, adminOnly: false },
  { to: "/conta", label: "Minha conta", icon: UserCog, exact: false, adminOnly: false },
] as const;

function NavLinks({ onNavigate, admin }: { onNavigate?: () => void; admin: boolean }) {
  return (
    <nav className="space-y-0.5">
      {NAV.filter((i) => admin || !i.adminOnly).map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact }}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function QuickCreate({ className }: { className?: string }) {
  const { openTask, openAction, openProject } = useForms();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className={cn("gap-1.5", className)}>
          <Plus className="size-4" />
          Criar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => openTask()}>Nova tarefa</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openAction()}>Nova ação</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openProject()}>Novo projeto</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OnboardingDialog() {
  const router = useRouter();
  const done = useServerFn(completeOnboarding);
  const [open, setOpen] = useState(true);

  async function finish(goTo?: "/empresas") {
    setOpen(false);
    await done();
    await router.invalidate();
    if (goTo) await router.navigate({ to: goTo });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && void finish()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao Automa</DialogTitle>
          <DialogDescription>
            São só quatro passos para começar a organizar o trabalho dos seus clientes.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm">
          {[
            ["1. Cadastre suas empresas", "Cada cliente vira uma empresa, com nome e cor própria."],
            ["2. Crie os projetos", "Trabalhos maiores, como um novo site ou uma campanha."],
            [
              "3. Registre as ações",
              "Reuniões, treinamentos, visitas e entregas com data e horário.",
            ],
            ["4. Crie as tarefas", "O que precisa ser feito, com prazo e responsável."],
          ].map(([t, d]) => (
            <li key={t}>
              <p className="font-semibold">{t}</p>
              <p className="text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => void finish()}>
            Explorar sozinho
          </Button>
          <Button onClick={() => void finish("/empresas")}>Começar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShellLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const doLogout = useServerFn(logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const admin = isAdmin(user);
  const showOnboarding = user.onboarding_done === false && !user.must_change_password;


  async function signOut() {
    await doLogout();
    await router.invalidate();
    await router.navigate({ to: "/login", replace: true });
  }

  return (
    <FormsProvider>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
          <div className="mb-6 flex items-center gap-2 px-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              A
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold">Automa</p>
              <p className="text-[11px] text-muted-foreground">Gestão operacional</p>
            </div>
          </div>
          <NavLinks admin={admin} />
          <div className="mt-auto border-t border-sidebar-border pt-3">
            <div className="px-2 pb-2">
              <p className="truncate text-xs font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
              <span className="text-sm font-semibold lg:hidden">Automa</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link to="/ajuda">
                  <HelpCircle className="size-4" />
                  <span className="hidden sm:inline">Ajuda</span>
                </Link>
              </Button>
              <QuickCreate />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-4">
            <SheetTitle className="mb-4 text-sm">Automa</SheetTitle>
            <NavLinks admin={admin} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-6 border-t border-border pt-3">
              <p className="px-1 text-xs font-semibold">{user.name}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start gap-2"
                onClick={signOut}
              >
                <LogOut className="size-4" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {showOnboarding ? <OnboardingDialog /> : null}
      </div>
    </FormsProvider>
  );
}
