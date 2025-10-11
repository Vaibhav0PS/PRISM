import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://pdpblpontpaamkbcryeg.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcGJscG9udHBhYW1rYmNyeWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDQyMzAsImV4cCI6MjA3NTYyMDIzMH0.vHfdxNGIsUuHalY3xQDozFxuiDBpZq_caXTNnYXE47c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  USERS: 'users',
  SCHOOLS: 'schools',
  REQUESTS: 'requests',
  UPDATES: 'updates',
  INTERESTS: 'interests'
};

// Enums
export const USER_ROLES = {
  SCHOOL_ADMIN: 'school_admin',
  DONOR: 'donor',
  ADMIN: 'admin'
};

export const SCHOOL_CATEGORIES = {
  RURAL: 'rural',
  TRIBAL: 'tribal',
  URBAN: 'urban'
};

export const REQUEST_TYPES = {
  SCHOLARSHIP: 'scholarship',
  INFRASTRUCTURE: 'infrastructure'
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  APPROVED: 'approved',
  LISTED: 'listed',
  COMPLETED: 'completed'
};

export const INTEREST_STATUS = {
  INTERESTED: 'interested',
  CONTACTED: 'contacted',
  COMMITTED: 'committed',
  COMPLETED: 'completed'
};