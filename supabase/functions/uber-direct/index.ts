import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UBER_CLIENT_ID = Deno.env.get('UBER_CLIENT_ID');
const UBER_CLIENT_SECRET = Deno.env.get('UBER_CLIENT_SECRET');
const UBER_CUSTOMER_ID = Deno.env.get('UBER_CUSTOMER_ID');

// Store address - update this with your actual store address
const STORE_ADDRESS = {
  street_address: ["Rua Exemplo, 123"],
  city: "São Paulo",
  state: "SP",
  zip_code: "01310-100",
  country: "BR"
};

const STORE_LOCATION = {
  latitude: -23.5505,
  longitude: -46.6333
};

interface UberToken {
  access_token: string;
  expires_in: number;
}

async function getAccessToken(): Promise<string> {
  console.log("Getting Uber access token...");
  
  // Use Basic Auth header for client credentials
  const credentials = btoa(`${UBER_CLIENT_ID}:${UBER_CLIENT_SECRET}`);
  
  const response = await fetch('https://login.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'direct.organizations'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token error:", error);
    
    // Try without scope if it fails
    console.log("Trying without scope...");
    const retryResponse = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    });
    
    if (!retryResponse.ok) {
      const retryError = await retryResponse.text();
      console.error("Token retry error:", retryError);
      throw new Error(`Failed to get access token: ${retryError}`);
    }
    
    const retryData: UberToken = await retryResponse.json();
    console.log("Access token obtained successfully (no scope)");
    return retryData.access_token;
  }

  const data: UberToken = await response.json();
  console.log("Access token obtained successfully");
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
  
  const deliveryData: any = {
    pickup_name: "Tarsi Sweet",
    pickup_address: JSON.stringify(STORE_ADDRESS),
    pickup_phone_number: "+5511999999999", // Update with actual store phone
    pickup_latitude: STORE_LOCATION.latitude,
    pickup_longitude: STORE_LOCATION.longitude,
    dropoff_name: dropoffName,
    dropoff_address: dropoffAddress,
    dropoff_phone_number: dropoffPhone,
    manifest_items: [
      {
        name: "Doces Tarsi Sweet",
        quantity: 1,
        size: "small",
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

  // Use quote_id if available for better pricing
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

async function getDeliveryStatus(accessToken: string, deliveryId: string) {
  console.log("Getting delivery status for:", deliveryId);
  
  const response = await fetch(`https://api.uber.com/v1/customers/${UBER_CUSTOMER_ID}/deliveries/${deliveryId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Status error:", error);
    throw new Error(`Failed to get delivery status: ${error}`);
  }

  const data = await response.json();
  console.log("Delivery status:", JSON.stringify(data));
  return data;
}

async function cancelDelivery(accessToken: string, deliveryId: string) {
  console.log("Cancelling delivery:", deliveryId);
  
  const response = await fetch(`https://api.uber.com/v1/customers/${UBER_CUSTOMER_ID}/deliveries/${deliveryId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Cancel error:", error);
    throw new Error(`Failed to cancel delivery: ${error}`);
  }

  const data = await response.json();
  console.log("Delivery cancelled:", JSON.stringify(data));
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!UBER_CLIENT_ID || !UBER_CLIENT_SECRET || !UBER_CUSTOMER_ID) {
      throw new Error("Missing Uber API credentials");
    }

    const { action, ...params } = await req.json();
    console.log("Action:", action, "Params:", JSON.stringify(params));

    // Get access token
    const accessToken = await getAccessToken();

    let result;

    switch (action) {
      case 'quote':
        // Get delivery quote/estimate
        result = await getDeliveryQuote(accessToken, params.dropoff_address);
        break;

      case 'create':
        // Create a new delivery
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
        // Get delivery status
        result = await getDeliveryStatus(accessToken, params.delivery_id);
        break;

      case 'cancel':
        // Cancel a delivery
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
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
