
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ServiceOrderCSV = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui será implementada a lógica para enviar os dados do formulário
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Preencher Ordem de Serviço (CSV)</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input id="client" placeholder="Nome do cliente" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="Telefone do cliente" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Email do cliente" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" placeholder="Endereço do cliente" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="device">Equipamento</Label>
            <Input id="device" placeholder="Nome do equipamento" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input id="brand" placeholder="Marca do equipamento" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Input id="model" placeholder="Modelo do equipamento" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial">Número de Série</Label>
            <Input id="serial" placeholder="Número de série" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defect">Defeito</Label>
            <Input id="defect" placeholder="Descrição do defeito" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observações</Label>
            <Input id="observation" placeholder="Observações adicionais" />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full md:w-auto">
            Criar Ordem de Serviço
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ServiceOrderCSV;
