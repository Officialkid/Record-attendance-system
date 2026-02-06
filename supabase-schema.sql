-- Christhood Ministry Attendance Management System
-- Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Services Table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_date DATE NOT NULL,
    service_type TEXT DEFAULT 'Saturday Fellowship',
    total_attendance INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visitors Table
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    visitor_name TEXT,
    visitor_contact TEXT,
    visit_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_services_date ON services(service_date DESC);
CREATE INDEX idx_visitors_service_id ON visitors(service_id);
CREATE INDEX idx_visitors_date ON visitors(visit_date DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Optional, uncomment if needed
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your authentication needs)
-- CREATE POLICY "Allow public read access on services" ON services FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on services" ON services FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public read access on visitors" ON visitors FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on visitors" ON visitors FOR INSERT WITH CHECK (true);
