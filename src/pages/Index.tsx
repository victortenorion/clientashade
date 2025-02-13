
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginForm } from "@/components/LoginForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex justify-end">
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center">
        <LoginForm />
      </main>
    </div>
  );
};

export default Index;
