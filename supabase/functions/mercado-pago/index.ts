// supabase/functions/mercado-pago/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Payment } from "npm:mercadopago";

// SUA CHAVE DE ACESSO (ACCESS TOKEN)
// Se der erro "Unauthorized", troque por uma chave que começa com TEST-
const ACCESS_TOKEN = "TEST-2078549267408285-120722-8f1cba20b26b087b6b08f1311bc9f479-257896712";

// Inicializa o cliente do Mercado Pago no servidor
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Trata requisições OPTIONS (CORS) para o navegador não bloquear
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Recebe os dados do Frontend
    const { formData, transaction_amount, description, payer } = await req.json();

    console.log("💳 Processando pagamento de: R$", transaction_amount);

    const payment = new Payment(client);

    const payerEmail = payer.email && payer.email.includes("@") 
      ? payer.email 
      : `test_user_${crypto.randomUUID().split('-')[0]}@test.com`;

    // Cria o pagamento na API do Mercado Pago
    const result = await payment.create({
      body: {
        transaction_amount: Number(transaction_amount),
        description: description || "Pedido Tarsi Sweet",
        payment_method_id: formData.payment_method_id,
        payer: {
          email: payer.email,
          first_name: payer.first_name || "Cliente",
          identification: formData.payer?.identification, 

        },
        token: formData.token,
        installments: Number(formData.installments),
        issuer_id: formData.issuer_id,
        // payer has info needed for antifraud
      },
      requestOptions: { idempotencyKey: crypto.randomUUID() }
    });

    console.log("✅ Resultado MP:", result.status);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("❌ Erro no pagamento:", error);
    // Retorna o erro detalhado para ajudarmos no debug
    return new Response(
      JSON.stringify({ error: error.message, details: error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});