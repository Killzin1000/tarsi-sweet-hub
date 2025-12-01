-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for order status
CREATE TYPE order_status AS ENUM (
  'novo',
  'aceito',
  'producao',
  'pronto',
  'a_caminho',
  'entregue',
  'cancelado'
);

-- Create enum for payment method
CREATE TYPE payment_method AS ENUM (
  'pix',
  'dinheiro',
  'cartao',
  'pagamento_retirada'
);

-- Create enum for transaction type
CREATE TYPE transaction_type AS ENUM (
  'entrada',
  'saida'
);

-- Create profiles table for customer data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  nascimento DATE,
  pontos_fidelidade INTEGER DEFAULT 0,
  selos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create produtos table
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create variacoes_produto table
CREATE TABLE public.variacoes_produto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  variacao TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addons table
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pedidos table
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'novo',
  forma_pagamento payment_method NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  endereco_entrega TEXT,
  horario_desejado TIMESTAMP WITH TIME ZONE,
  observacao TEXT,
  pontos_ganhos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create itens_pedido table
CREATE TABLE public.itens_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  variacao_id UUID REFERENCES public.variacoes_produto(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  addons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ingredientes table
CREATE TABLE public.ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  quantidade_atual DECIMAL(10,3) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create receitas table
CREATE TABLE public.receitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  ingrediente_id UUID REFERENCES public.ingredientes(id) ON DELETE CASCADE NOT NULL,
  quantidade_usada DECIMAL(10,3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_id, ingrediente_id)
);

-- Create caixa table
CREATE TABLE public.caixa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo transaction_type NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  forma_pagamento payment_method,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cupons table
CREATE TABLE public.cupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL,
  desconto_percentual INTEGER,
  desconto_valor DECIMAL(10,2),
  minimo_compra DECIMAL(10,2) DEFAULT 0,
  validade DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variacoes_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for produtos (public read, admin write)
CREATE POLICY "Anyone can view active products"
  ON public.produtos FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage products"
  ON public.produtos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for variacoes_produto
CREATE POLICY "Anyone can view product variations"
  ON public.variacoes_produto FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage variations"
  ON public.variacoes_produto FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for addons
CREATE POLICY "Anyone can view addons"
  ON public.addons FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage addons"
  ON public.addons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pedidos
CREATE POLICY "Users can view their own orders"
  ON public.pedidos FOR SELECT
  USING (cliente_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create orders"
  ON public.pedidos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update orders"
  ON public.pedidos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for itens_pedido
CREATE POLICY "Users can view their order items"
  ON public.itens_pedido FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos
      WHERE pedidos.id = itens_pedido.pedido_id
      AND (pedidos.cliente_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Authenticated users can insert order items"
  ON public.itens_pedido FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for ingredientes
CREATE POLICY "Admins can manage ingredients"
  ON public.ingredientes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for receitas
CREATE POLICY "Admins can manage recipes"
  ON public.receitas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for caixa
CREATE POLICY "Admins can manage cash register"
  ON public.caixa FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cupons
CREATE POLICY "Anyone can view active coupons"
  ON public.cupons FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage coupons"
  ON public.cupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ingredientes_updated_at
  BEFORE UPDATE ON public.ingredientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cupons_updated_at
  BEFORE UPDATE ON public.cupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, telefone, nascimento)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.raw_user_meta_data->>'telefone',
    (NEW.raw_user_meta_data->>'nascimento')::date
  );
  
  -- Assign default cliente role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update loyalty points after order
CREATE OR REPLACE FUNCTION public.update_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
    -- Add points (1 point per R$1)
    UPDATE public.profiles
    SET 
      pontos_fidelidade = pontos_fidelidade + NEW.pontos_ganhos,
      selos = selos + 1
    WHERE id = NEW.cliente_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for loyalty points
CREATE TRIGGER update_points_on_order_complete
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  WHEN (NEW.status = 'entregue' AND OLD.status != 'entregue')
  EXECUTE FUNCTION public.update_loyalty_points();