import { supabase } from "@/integrations/supabase/client";

export const seedInitialProducts = async () => {
  try {
    // Check if products already exist
    const { data: existingProducts } = await supabase
      .from("produtos")
      .select("id")
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      return { success: true, message: "Products already exist" };
    }

    // Insert sample products
    const sampleProducts = [
      {
        nome: "Trufas Sortidas",
        descricao: "Deliciosas trufas de chocolate em diversos sabores: tradicional, morango, café e avelã. Feitas com chocolate belga premium.",
        categoria: "Trufas",
        preco: 45.00,
        imagem_url: "trufas",
        ativo: true,
      },
      {
        nome: "Brownie Recheado",
        descricao: "Brownie super fudgy com pedaços de nozes e cobertura de chocolate. Perfeito para quem ama chocolate intenso!",
        categoria: "Brownies",
        preco: 35.00,
        imagem_url: "brownie",
        ativo: true,
      },
      {
        nome: "Bolo de Aniversário",
        descricao: "Bolo de chocolate com recheio e cobertura de brigadeiro rosa. Decoração personalizada inclusa. Serve 15 pessoas.",
        categoria: "Bolos",
        preco: 120.00,
        imagem_url: "bolo",
        ativo: true,
      },
      {
        nome: "Brigadeiros Gourmet",
        descricao: "Brigadeiros artesanais em sabores variados: tradicional, morango, maracujá, limão e pistache. Embalagem para presente.",
        categoria: "Brigadeiros",
        preco: 40.00,
        imagem_url: "brigadeiros",
        ativo: true,
      },
      {
        nome: "Kit Festa",
        descricao: "Combo perfeito para festas! Inclui 30 brigadeiros, 20 beijinhos e 10 cajuzinhos. Ideal para 20 pessoas.",
        categoria: "Kits",
        preco: 85.00,
        imagem_url: "brigadeiros",
        ativo: true,
      },
      {
        nome: "Bolo no Pote",
        descricao: "Delicioso bolo em camadas servido em pote individual. Sabores: chocolate, red velvet e maracujá.",
        categoria: "Bolos",
        preco: 15.00,
        imagem_url: "bolo",
        ativo: true,
      },
    ];

    const { error } = await supabase
      .from("produtos")
      .insert(sampleProducts);

    if (error) throw error;

    return { success: true, message: "Sample products added successfully" };
  } catch (error) {
    console.error("Error seeding products:", error);
    return { success: false, error };
  }
};