
export const formatMoney = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
