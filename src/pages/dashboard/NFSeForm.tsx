
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NFSeEmissionForm } from "./components/nfse/NFSeEmissionForm";

export default function NFSeForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: nfseId } = useParams();
  const [open, setOpen] = useState(true);
  
  const serviceOrderId = searchParams.get('service_order_id');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">
          {nfseId ? "Editar NFS-e" : "Nova NFS-e"}
        </h2>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {nfseId ? "Editar NFS-e" : "Emitir NFS-e"}
            </DialogTitle>
          </DialogHeader>
          
          <NFSeEmissionForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
