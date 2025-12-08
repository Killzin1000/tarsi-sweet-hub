import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from 'react';

// Inicializa com sua Public Key de TESTE
// Garanta que esta é a chave TEST- do seu painel
initMercadoPago('TEST-9cbc5fc7-7d5e-4371-ad3a-2965b7bc2b02', {
  locale: 'pt-BR'
});

interface PaymentBrickProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
  customerEmail?: string;
}

const PaymentBrick = ({ amount, onSuccess, customerEmail = "test@testuser.com" }: PaymentBrickProps) => {
  const [processing, setProcessing] = useState(false);

  const initialization = {
    amount: amount,
  };

  const customization = {
    paymentMethods: {
      // ✅ Habilitados
      creditCard: "all",      // Aceita todas as bandeiras de crédito
      bankTransfer: "all",    // Aceita Pix
      
      // ❌ Desabilitados
      debitCard: [],          // Remove débito
      ticket: [],             // Remove boleto
      atm: [],                // Remove pagamento em caixa eletrônico
      
      maxInstallments: 1      // Mantendo limite de parcelas (ajuste se quiser mais)
    },
    visual: {
      style: {
        theme: 'default' as const, 
        customVariables: {
          baseColor: '#E68AB4', // Rosa Tarsi Sweet
        }
      },
      hidePaymentButton: false,
      hideValue: false, 
    },
  };

  const onSubmit = async ({ formData }: any) => {
    setProcessing(true);
    console.log("🚀 Enviando dados para o Backend...");
    
    try {
      const { data, error } = await supabase.functions.invoke('mercado-pago', {
        body: {
          formData,
          transaction_amount: amount,
          description: "Pedido Tarsi Sweet",
          payer: {
            email: customerEmail,
            first_name: "Cliente Tarsi"
          }
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      console.log("Status do Pagamento:", data.status);

      // ✅ AJUSTE AQUI: Aceitar 'pending' como sucesso para Pix
      if (data.status === 'approved') {
        toast.success("Pagamento Aprovado! 🎉");
        onSuccess(data.id.toString());
      } else if (data.status === 'in_process' || data.status === 'pending') {
        // 'pending' é o status padrão do Pix recém-criado
        toast.success("Código Pix Gerado! Finalize o pagamento.");
        // Passamos o ID para criar o pedido, mesmo pendente
        onSuccess(data.id.toString()); 
      } else {
        toast.error(`Pagamento não concluído: ${data.status_detail}`);
      }

    } catch (e: any) {
      console.error("❌ Erro crítico:", e);
      toast.error("Erro ao processar. Verifique os dados.");
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="font-medium text-muted-foreground">Processando pagamento seguro...</p>
        <p className="text-xs text-muted-foreground mt-2">Não feche esta página</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-2 rounded-lg border border-border/50 shadow-sm">
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onReady={() => console.log("✅ Brick de Pagamento Pronto (Crédito + Pix)")}
        onError={(error) => console.error("❌ Erro no Brick:", error)}
      />
    </div>
  );
};

export default PaymentBrick;