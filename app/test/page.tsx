import { createClient } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createClient();
  
  let connectionStatus = 'Unknown';
  let userStatus = 'Not authenticated';
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      connectionStatus = `Error: ${error.message}`;
    } else if (user) {
      connectionStatus = 'Connected to Supabase';
      userStatus = `Authenticated as: ${user.email}`;
    } else {
      connectionStatus = 'Connected to Supabase';
      userStatus = 'Not authenticated';
    }
  } catch (err) {
    connectionStatus = `Connection failed: ${err}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Supabase Connection Test</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700">Environment Variables:</h2>
            <p className="text-sm text-gray-600">
              URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
            </p>
            <p className="text-sm text-gray-600">
              Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}
            </p>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-700">Connection Status:</h2>
            <p className="text-sm text-gray-600">{connectionStatus}</p>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-700">User Status:</h2>
            <p className="text-sm text-gray-600">{userStatus}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
