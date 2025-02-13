
import { useParams, useNavigate } from "react-router-dom";
import { ServiceOrderNFSe } from "./components/ServiceOrderNFSe";

const NFSeFromServiceOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <div>Ordem de serviço não encontrada</div>;
  }

  return (
    <ServiceOrderNFSe
      serviceOrderId={id}
      onSubmit={() => navigate("/dashboard/service-orders")}
      onCancel={() => navigate("/dashboard/service-orders")}
    />
  );
};

export default NFSeFromServiceOrder;
