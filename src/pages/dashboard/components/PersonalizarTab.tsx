
import { ClientFieldsTab } from "./ClientFieldsTab";

const PersonalizarTab = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Personalizar</h2>
        <p className="text-muted-foreground">
          Configure as opções de personalização do sistema.
        </p>
      </div>
      
      <div className="space-y-8">
        <ClientFieldsTab />
      </div>
    </div>
  );
};

export default PersonalizarTab;
