-- Tabela profiles (sincroniza com auth.users via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance em queries por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Trigger para popular profiles quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies: Usuários veem apenas informações públicas de outros
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode ler profiles (para buscar membros)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Usuários só atualizam seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Adicionar coluna email em family_members (se não existir)
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS email TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email);
