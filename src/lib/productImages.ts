import trufas from "@/assets/trufas.jpg";
import brownie from "@/assets/brownie.jpg";
import bolo from "@/assets/bolo.jpg";
import brigadeiros from "@/assets/brigadeiros.jpg";

export const productImages: Record<string, string> = {
  trufas,
  brownie,
  bolo,
  brigadeiros,
};

export const getProductImage = (imageName: string | null): string | null => {
  if (!imageName) return null;
  return productImages[imageName] || null;
};