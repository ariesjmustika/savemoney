-- 1. Drop existing problematic policies (Aggressive cleanup)
DROP POLICY IF EXISTS "wallets_select_policy" ON wallets;
DROP POLICY IF EXISTS "wallets_select_new" ON wallets;
DROP POLICY IF EXISTS "Users can view wallets they are members of" ON wallets;
DROP POLICY IF EXISTS "wallets_insert_policy" ON wallets;
DROP POLICY IF EXISTS "wallets_insert_new" ON wallets;
DROP POLICY IF EXISTS "wallets_update_new" ON wallets;
DROP POLICY IF EXISTS "Owners can update their wallets" ON wallets;

DROP POLICY IF EXISTS "wallet_members_select_own" ON wallet_members;
DROP POLICY IF EXISTS "wallet_members_select_owner" ON wallet_members;
DROP POLICY IF EXISTS "wallet_members_select_new" ON wallet_members;
DROP POLICY IF EXISTS "Users can view members of their wallets" ON wallet_members;
DROP POLICY IF EXISTS "wallet_members_insert_policy" ON wallet_members;
DROP POLICY IF EXISTS "wallet_members_insert_new" ON wallet_members;
DROP POLICY IF EXISTS "Users can insert wallet members" ON wallet_members;

DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_select_new" ON transactions;
DROP POLICY IF EXISTS "Users can view transactions of wallets they are members of" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_new" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions into their wallets" ON transactions;

-- 2. Create Security Definer Functions to break recursion
-- These functions run with the privileges of the creator (bypass RLS)
CREATE OR REPLACE FUNCTION check_wallet_access(w_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM wallets 
    WHERE id = w_id AND owner_id = u_id
  ) OR EXISTS (
    SELECT 1 FROM wallet_members 
    WHERE wallet_id = w_id AND profile_id = u_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_wallet_owner(w_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM wallets 
    WHERE id = w_id AND owner_id = u_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Apply non-recursive policies using the functions

-- Wallets
CREATE POLICY "wallets_select_new" ON wallets 
FOR SELECT USING (check_wallet_access(id, auth.uid()));

CREATE POLICY "wallets_insert_new" ON wallets 
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "wallets_update_new" ON wallets 
FOR UPDATE USING (auth.uid() = owner_id);

-- Wallet Members
CREATE POLICY "wallet_members_select_new" ON wallet_members 
FOR SELECT USING (profile_id = auth.uid() OR is_wallet_owner(wallet_id, auth.uid()));

CREATE POLICY "wallet_members_insert_new" ON wallet_members 
FOR INSERT WITH CHECK (profile_id = auth.uid() OR is_wallet_owner(wallet_id, auth.uid()));

-- Transactions
CREATE POLICY "transactions_select_new" ON transactions 
FOR SELECT USING (check_wallet_access(wallet_id, auth.uid()));

CREATE POLICY "transactions_insert_new" ON transactions 
FOR INSERT WITH CHECK (check_wallet_access(wallet_id, auth.uid()));

-- Profiles (Re-affirming)
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
CREATE POLICY "profiles_insert_new" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "profiles_select_new" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "profiles_update_new" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories (Public)
DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_new" ON categories FOR SELECT USING (true);
