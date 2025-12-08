import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UBER_CLIENT_ID = Deno.env.get('UBER_CLIENT_ID');
const UBER_CLIENT_SECRET = Deno.env.get('UBER_CLIENT_SECRET');
const UBER_CUSTOMER_ID = Deno.env.get('UBER_CUSTOMER_ID');

// Endereço da Loja
const STORE_ADDRESS = {
  street_address: ["Rua dos Argentinos, 127"],
  city: "São Paulo",
  state: "SP",
  zip_code: "03878-020",
  country: "BR"
};

// Coordenadas
const STORE_LOCATION = {
  latitude: -23.50941175264895, 
  longitude: -46.49309144575759
};

interface UberToken {
  access_token: string;
  expires_in: number;
}

// Função auxiliar para formatar telefone para E.164 (+55...)
function formatPhoneNumber(phone: string): string {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não tiver o código do país (55) e tiver 10 ou 11 dígitos, adiciona
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  
  // Adiciona o + na frente se não tiver
  return `+${cleaned}`;
}

async function getAccessToken(): Promise<string> {
  console.log("Getting Uber access token...");
  
  const credentials = btoa(`${UBER_CLIENT_ID}:${UBER_CLIENT_SECRET}`);
  
  const response = await fetch('https://login.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'eats.deliveries direct.organizations'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token error:", error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data: UberToken = await response.json();
  return data.access_token;
}

async function getDeliveryQuote(accessToken: string, dropoffAddress: string) {
  console.log("Getting delivery quote for:", dropoffAddress);
  
  const response = await fetch('https://api.uber.com/v1/customers/' + UBER_CUSTOMER_ID + '/delivery_quotes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pickup_address: JSON.stringify(STORE_ADDRESS),
      dropoff_address: dropoffAddress,
      pickup_latitude: STORE_LOCATION.latitude,
      pickup_longitude: STORE_LOCATION.longitude,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Quote error:", error);
    throw new Error(`Failed to get delivery quote: ${error}`);
  }

  const data = await response.json();
  console.log("Delivery quote received:", JSON.stringify(data));
  return data;
}

async function createDelivery(
  accessToken: string,
  dropoffAddress: string,
  dropoffName: string,
  dropoffPhone: string,
  orderDetails: string,
  quoteId?: string
) {
  console.log("Creating delivery...");
  
  // Formata o telefone do cliente
  const formattedDropoffPhone = formatPhoneNumber(dropoffPhone);
  
  const deliveryData: any = {
    pickup_name: "Tarsi Sweet",
    pickup_address: JSON.stringify(STORE_ADDRESS),
    pickup_phone_number: "+5511980732523",
    pickup_latitude: STORE_LOCATION.latitude,
    pickup_longitude: STORE_LOCATION.longitude,
    dropoff_name: dropoffName,
    dropoff_address: dropoffAddress,
    dropoff_phone_number: formattedDropoffPhone, // Usa o telefone formatado
    manifest_items: [
      {
        name: "Doces Tarsi Sweet",
        quantity: 1,
        size: "small",
        weight: 1000,
        dimensions: {
          length: 30,
          height: 20,
          depth: 30
        },
        price: 0,
        must_be_upright: true
      }
    ],
    pickup_notes: orderDetails,
    dropoff_notes: "Entregar na portaria se não atender",
    deliverable_action: "deliverable_action_meet_at_door",
    testSpecifications: {
      roboCourierSpecification: {
        mode: "auto"
      }
    }
  };

  if (quoteId) {
    deliveryData.quote_id = quoteId;
  }

  const response = await fetch('https://api.uber.com/v1/customers/' + UBER_CUSTOMER_ID + '/deliveries', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deliveryData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Delivery creation error:", error);
    throw new Error(`Failed to create delivery: ${error}`);
  }

  const data = await response.json();
  console.log("Delivery created:", JSON.stringify(data));
  return data;
}

// ... Resto das funções auxiliares (getDeliveryStatus, cancelDelivery) mantidas iguais ...
async function getDeliveryStatus(accessToken: string, deliveryId: string) {
  const response = await fetch(`https://api.uber.com/v1/customers/${UBER_CUSTOMER_ID}/deliveries/${deliveryId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

async function cancelDelivery(accessToken: string, deliveryId: string) {
  const response = await fetch(`https://api.uber.com/v1/customers/${UBER_CUSTOMER_ID}/deliveries/${deliveryId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!UBER_CLIENT_ID || !UBER_CLIENT_SECRET || !UBER_CUSTOMER_ID) {
      throw new Error("Missing Uber API credentials");
    }

    const { action, ...params } = await req.json();
    console.log("Action:", action, "Params:", JSON.stringify(params));

    const accessToken = await getAccessToken();
    let result;

    switch (action) {
      case 'quote':
        result = await getDeliveryQuote(accessToken, params.dropoff_address);
        break;
      case 'create':
        result = await createDelivery(
          accessToken,
          params.dropoff_address,
          params.dropoff_name,
          params.dropoff_phone,
          params.order_details,
          params.quote_id
        );
        break;
      case 'status':
        result = await getDeliveryStatus(accessToken, params.delivery_id);
        break;
      case 'cancel':
        result = await cancelDelivery(accessToken, params.delivery_id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in uber-direct function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});