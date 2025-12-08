import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from 'react';

// Chave Pública de Teste
initMercadoPago('TEST-9cbc5fc7-7d5e-4371-ad3a-2965b7bc2b02', {
  locale: 'pt-BR'
});

interface PaymentBrickProps {
  amount: number;
  onSuccess: (data: { id: string; status: string; qrCode?: string; qrCodeBase64?: string }) => void;
  customerEmail?: string;
}

const PaymentBrick = ({ amount, onSuccess, customerEmail = "cliente@tarsisweet.com" }: PaymentBrickProps) => {
  const [processing, setProcessing] = useState(false);

  const initialization = {
    amount: amount,
  };

  const customization = {
    paymentMethods: {
      creditCard: "all",
      bankTransfer: "all",
      debitCard: [],
      ticket: [],
      atm: [],
      maxInstallments: 3
    },
    visual: {
      style: {
        theme: 'default' as const, 
        customVariables: {
          baseColor: '#E68AB4',
        }
      },
      hidePaymentButton: false,
      hideValue: false, 
    },
  };

  const onSubmit = async ({ formData }: any) => {
    // Não ativamos setProcessing(true) visualmente para não desmontar o brick antes da hora
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

      // Dados do Pix (se existirem)
      const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;

      if (data.status === 'approved') {
        toast.success("Pagamento Aprovado! 🎉");
        onSuccess({ id: data.id.toString(), status: 'approved' });
      } else if (data.status === 'in_process' || data.status === 'pending') {
        toast.success("Pedido criado! Finalize o pagamento.");
        // Passamos os dados do Pix para o pai
        onSuccess({ 
          id: data.id.toString(), 
          status: data.status, 
          qrCode, 
          qrCodeBase64 
        });
      } else {
        toast.error(`Pagamento recusado: ${data.status_detail}`);
      }

    } catch (e: any) {
      console.error("❌ Erro crítico:", e);
      toast.error("Erro ao processar. Verifique os dados.");
    }
  };

  return (
    <div className="w-full bg-white p-2 rounded-lg border border-border/50 shadow-sm">
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onReady={() => console.log("✅ Brick de Pagamento Pronto")}
        onError={(error) => console.error("❌ Erro no Brick:", error)}
      />
    </div>
  );
};

export default PaymentBrick;