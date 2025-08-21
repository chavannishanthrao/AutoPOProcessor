-- =====================================================
-- Sales Order AI Automation Platform Database Export
-- Generated on: 2025-08-21
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLE: tenants
-- Multi-tenant isolation for SaaS platform
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    plan VARCHAR NOT NULL DEFAULT 'enterprise',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABLE: users
-- User management with tenant-based isolation
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    role VARCHAR NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(email, tenant_id)
);

-- =====================================================
-- TABLE: oauth_configurations
-- Database-driven OAuth configuration per tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_configurations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    provider VARCHAR NOT NULL CHECK (provider IN ('gmail', 'microsoft')),
    client_id VARCHAR NOT NULL,
    client_secret VARCHAR NOT NULL,
    redirect_uri VARCHAR NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, provider)
);

-- =====================================================
-- TABLE: email_accounts
-- Email account configurations for monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS email_accounts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    email VARCHAR NOT NULL,
    provider VARCHAR NOT NULL CHECK (provider IN ('gmail', 'microsoft', 'imap')),
    access_token TEXT,
    refresh_token TEXT,
    imap_config JSONB,
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, email)
);

-- =====================================================
-- TABLE: purchase_orders
-- Core business entity for purchase order processing
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    po_number VARCHAR NOT NULL,
    vendor_name VARCHAR NOT NULL,
    vendor_address TEXT,
    total_amount NUMERIC,
    currency VARCHAR DEFAULT 'USD',
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    email_source VARCHAR,
    original_email JSONB,
    extracted_data JSONB,
    validation_results JSONB,
    erp_push_result JSONB,
    failure_reason TEXT,
    human_review_required BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, po_number)
);

-- =====================================================
-- TABLE: erp_systems
-- ERP integration configurations per tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS erp_systems (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('netsuite', 'sap', 'oracle', 'dynamics')),
    endpoint VARCHAR NOT NULL,
    credentials JSONB,
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABLE: ai_configurations
-- AI model configurations per tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_configurations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    provider VARCHAR NOT NULL CHECK (provider IN ('openai', 'anthropic', 'custom')),
    model_name VARCHAR NOT NULL,
    api_key TEXT,
    endpoint VARCHAR,
    configuration JSONB,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABLE: vendors
-- Master vendor data with alternate names for matching
-- =====================================================
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    name VARCHAR NOT NULL,
    alternate_names JSONB,
    address TEXT,
    tax_id VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, name)
);

-- =====================================================
-- TABLE: processing_logs
-- Audit trail for all processing activities
-- =====================================================
CREATE TABLE IF NOT EXISTS processing_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    purchase_order_id VARCHAR REFERENCES purchase_orders(id),
    stage VARCHAR NOT NULL CHECK (stage IN ('email_processing', 'ai_extraction', 'validation', 'erp_push')),
    status VARCHAR NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    start_time TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITHOUT TIME ZONE,
    duration INTEGER,
    details JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABLE: extracted_po_data
-- Raw extracted data from documents before validation
-- =====================================================
CREATE TABLE IF NOT EXISTS extracted_po_data (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    email_account_id VARCHAR NOT NULL REFERENCES email_accounts(id),
    email_subject VARCHAR,
    email_from VARCHAR,
    email_date TIMESTAMP WITHOUT TIME ZONE,
    po_number VARCHAR,
    supplier VARCHAR,
    buyer VARCHAR,
    date TIMESTAMP WITHOUT TIME ZONE,
    amount NUMERIC,
    currency VARCHAR DEFAULT 'USD',
    line_items JSONB,
    attachment_name VARCHAR,
    extracted_text TEXT,
    llm_response JSONB,
    processing_status VARCHAR DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABLE: notifications
-- System notifications and alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
    user_id VARCHAR REFERENCES users(id),
    type VARCHAR NOT NULL CHECK (type IN ('success', 'error', 'warning', 'info')),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_entity VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABLE: sessions
-- Session management for Replit Auth
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- =====================================================
-- INDEXES for performance optimization
-- =====================================================

-- Tenant-based indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_configurations_tenant_id ON oauth_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_tenant_id ON email_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_erp_systems_tenant_id ON erp_systems(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_tenant_id ON processing_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_extracted_po_data_tenant_id ON extracted_po_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_logs_purchase_order_id ON processing_logs(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);

-- =====================================================
-- SAMPLE DATA INSERT
-- =====================================================

-- Insert default tenant
INSERT INTO tenants (id, name, plan, created_at, updated_at) 
VALUES (
    'default-tenant-1', 
    'Default Organization', 
    'enterprise', 
    '2025-08-21 07:31:58.781618', 
    '2025-08-21 07:31:58.781618'
) ON CONFLICT (id) DO NOTHING;

-- Insert default admin user
INSERT INTO users (id, email, password, first_name, last_name, profile_image_url, tenant_id, role, created_at, updated_at) 
VALUES (
    '6a6f52a4-7b44-420f-b846-a82a6335eaee',
    'chavanv@dotsolved.com',
    'b0102256a04a1d80e2e2e6c8bb7e18ac4ebe0850c41e12ace9b48fe31f1793b475fa2ba90b0665db28b8f12cd889f3a2fa55a4cad2151cb92d28ecd0bf0a5027.d85caddedd16c8ce371f8ca1d4cf97c3',
    'Chavan',
    'V',
    NULL,
    'default-tenant-1',
    'admin',
    '2025-08-21 07:32:12.735358',
    '2025-08-21 07:32:12.735358'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample OAuth configuration (Microsoft)
INSERT INTO oauth_configurations (id, tenant_id, provider, client_id, client_secret, redirect_uri, scopes, is_active, created_at, updated_at)
VALUES (
    'f465e7fb-2fa3-4122-b342-e76512a3d73f',
    'default-tenant-1',
    'microsoft',
    '595a854c-fcb7-4a0a-b455-e43c53be19be',
    'qPZ8Q~H_IOL7d58idpj7b093d~VLlbHPcQeOTbLM',
    'http://localhost:5000/auth/outlook/callback',
    '{}',
    true,
    '2025-08-21 08:58:20.144108',
    '2025-08-21 08:58:20.144108'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TRIGGERS for updated_at timestamps
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oauth_configurations_updated_at BEFORE UPDATE ON oauth_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON email_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_erp_systems_updated_at BEFORE UPDATE ON erp_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_configurations_updated_at BEFORE UPDATE ON ai_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_extracted_po_data_updated_at BEFORE UPDATE ON extracted_po_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS for documentation
-- =====================================================

COMMENT ON TABLE tenants IS 'Multi-tenant organization management';
COMMENT ON TABLE users IS 'User accounts with tenant-based isolation and RBAC';
COMMENT ON TABLE oauth_configurations IS 'Database-driven OAuth credentials per tenant for email providers';
COMMENT ON TABLE email_accounts IS 'Connected email accounts for monitoring purchase orders';
COMMENT ON TABLE purchase_orders IS 'Core business entity representing processed purchase orders';
COMMENT ON TABLE erp_systems IS 'ERP system integration configurations';
COMMENT ON TABLE ai_configurations IS 'AI model configurations for document processing';
COMMENT ON TABLE vendors IS 'Master vendor data with alternate names for matching';
COMMENT ON TABLE processing_logs IS 'Complete audit trail of all processing activities';
COMMENT ON TABLE extracted_po_data IS 'Raw extracted data from AI processing before validation';
COMMENT ON TABLE notifications IS 'System notifications and user alerts';
COMMENT ON TABLE sessions IS 'Session storage for Replit Auth authentication';

-- =====================================================
-- GRANTS for proper permissions
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO neondb_owner;

-- Grant all privileges on tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

-- =====================================================
-- END OF DATABASE EXPORT
-- =====================================================

/*
DATABASE EXPORT SUMMARY:
- 12 main tables with proper relationships
- Multi-tenant architecture with data isolation
- Database-driven OAuth configuration system
- Complete audit trail and processing logs
- Proper indexes for performance
- Automatic timestamp updates via triggers
- Sample data for testing and deployment
- Ready for production deployment

FEATURES IMPLEMENTED:
✓ Multi-tenant SaaS architecture
✓ Database-driven OAuth configuration
✓ Email account management
✓ Purchase order processing pipeline
✓ ERP system integration
✓ AI configuration management
✓ Vendor master data management
✓ Complete audit logging
✓ User notification system
✓ Session management for Replit Auth

DEPLOYMENT INSTRUCTIONS:
1. Create a new PostgreSQL database
2. Run this SQL script to create all tables and indexes
3. Configure environment variables for DATABASE_URL
4. Start the application with npm run dev
5. Access admin interface at /email-configuration to set up OAuth
*/