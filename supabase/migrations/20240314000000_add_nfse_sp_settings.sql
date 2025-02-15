
CREATE TABLE IF NOT EXISTS nfse_sp_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inscricao_municipal TEXT,
  codigo_regime_tributario TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  lote_rps_numero INTEGER NOT NULL DEFAULT 1,
  versao_schema TEXT NOT NULL DEFAULT '2.00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  tipo_regime_especial TEXT,
  operacao_tributacao TEXT,
  cpf_responsavel TEXT,
  producao_intermediario BOOLEAN DEFAULT false,
  iss_retido_intermediario BOOLEAN DEFAULT false,
  intermediario_cnpj TEXT,
  intermediario_inscricao_municipal TEXT,
  intermediario_email TEXT,
  servico_codigo_item_lista TEXT,
  servico_discriminacao_item TEXT,
  servico_valor_item DECIMAL(10,2) DEFAULT 0,
  servico_codigo_local_prestacao TEXT,
  servico_iss_retido BOOLEAN DEFAULT false,
  servico_exigibilidade TEXT,
  servico_operacao TEXT,
  servico_aliquota DECIMAL(10,2) DEFAULT 0,
  rps_status TEXT DEFAULT 'N',
  proxy_host TEXT,
  proxy_port TEXT,
  wsdl_homologacao TEXT,
  wsdl_producao TEXT,
  tipo_documento_prestador TEXT
);

CREATE OR REPLACE FUNCTION increment_rps_numero()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  ultima_rps_numero INTEGER;
  serie_rps_padrao TEXT;
  tipo_rps TEXT;
  ambiente TEXT;
BEGIN
  -- Obter configurações atuais
  SELECT nf.ultima_nfse_numero + 1, 'RPS', '1', nf.ambiente
  INTO ultima_rps_numero, serie_rps_padrao, tipo_rps, ambiente
  FROM nfse_config nf
  LIMIT 1;

  -- Atualizar último número
  UPDATE nfse_config
  SET ultima_nfse_numero = ultima_rps_numero
  WHERE true;

  RETURN json_build_object(
    'ultima_rps_numero', ultima_rps_numero,
    'serie_rps_padrao', serie_rps_padrao,
    'tipo_rps', tipo_rps,
    'ambiente', ambiente
  );
END;
$$;

-- Criar tabela de logs da SEFAZ
CREATE TABLE IF NOT EXISTS nfse_sefaz_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nfse_id UUID NOT NULL REFERENCES nfse(id),
  status TEXT NOT NULL,
  message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de fila de transmissão
CREATE TABLE IF NOT EXISTS sefaz_transmission_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  documento_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  erro_mensagem TEXT,
  tentativas INTEGER DEFAULT 0,
  ultima_tentativa TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_nfse_sefaz_logs_nfse_id ON nfse_sefaz_logs(nfse_id);
CREATE INDEX IF NOT EXISTS idx_sefaz_queue_documento ON sefaz_transmission_queue(documento_id);
CREATE INDEX IF NOT EXISTS idx_sefaz_queue_status ON sefaz_transmission_queue(status);
