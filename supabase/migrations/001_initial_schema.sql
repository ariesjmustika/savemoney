-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- WALLETS
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'IDR',
  balance DECIMAL(15, 2) DEFAULT 0,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- WALLET MEMBERS (for shared wallets)
CREATE TABLE wallet_members (
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'member'
  PRIMARY KEY (wallet_id, profile_id)
);

-- CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  receipt_image_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TRANSACTION HISTORY (Audit Log)
CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL,
  action_type TEXT CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')) NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- AI EVALUATIONS
CREATE TABLE ai_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL, -- e.g., '2024-04'
  content TEXT NOT NULL,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS POLICIES

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view wallets they are members of" ON wallets 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallet_members 
      WHERE wallet_members.wallet_id = wallets.id AND wallet_members.profile_id = auth.uid()
    ) OR owner_id = auth.uid()
  );

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transactions of wallets they are members of" ON transactions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallet_members 
      WHERE wallet_members.wallet_id = transactions.wallet_id AND wallet_members.profile_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM wallets WHERE wallets.id = transactions.wallet_id AND wallets.owner_id = auth.uid()
    )
  );

-- TRIGGERS FOR AUDIT LOGGING

-- Trigger function for transactions
CREATE OR REPLACE FUNCTION log_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO transaction_history (transaction_id, action_type, changed_by, new_data)
    VALUES (NEW.id, 'CREATE', NEW.created_by, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO transaction_history (transaction_id, action_type, changed_by, previous_data, new_data)
    VALUES (NEW.id, 'UPDATE', NEW.created_by, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO transaction_history (transaction_id, action_type, changed_by, previous_data)
    VALUES (OLD.id, 'DELETE', auth.uid(), row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER transaction_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_transaction_change();
