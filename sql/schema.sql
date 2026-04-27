-- ============================================================
-- Schema: Sistema de autenticação e assinaturas
-- Banco: Neon Database (PostgreSQL)
-- ============================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID            DEFAULT uuid_generate_v4() PRIMARY KEY,
    username        VARCHAR(50)     UNIQUE NOT NULL,
    email           VARCHAR(255)    UNIQUE NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMPTZ     DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- TABELA: subscriptions
-- Armazena o plano de assinatura de cada usuário.
-- plan_status: 'active' | 'inactive' | 'cancelled' | 'expired'
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id                      UUID            DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id                 UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name               VARCHAR(50)     NOT NULL DEFAULT 'free',
    plan_status             VARCHAR(20)     NOT NULL DEFAULT 'inactive',
    price                   DECIMAL(10,2),
    currency                VARCHAR(3)      DEFAULT 'BRL',
    started_at              TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    payment_method          VARCHAR(50),
    external_subscription_id VARCHAR(255),  -- ID do gateway (Stripe, Patreon, etc.)
    created_at              TIMESTAMPTZ     DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- Índices para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ============================================================
-- Função + triggers para auto-atualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
