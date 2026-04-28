import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../abelus-backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  console.log(`Connecting to ${supabaseUrl}...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@abelus.com',
    password: 'Password123!', // Temporary password
    email_confirm: true,
    user_metadata: { name: 'Admin User', role: 'admin' }
  });

  if (error) {
    console.error('Error creating admin:', error.message);
  } else {
    console.log('Admin user created successfully in Supabase Auth:', data.user.id);
  }
}

createAdmin();
