exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    console.log('Test function called')
    console.log('Event:', JSON.stringify(event, null, 2))
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Test function is working',
        timestamp: new Date().toISOString(),
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          nodeVersion: process.version
        },
        event: {
          httpMethod: event.httpMethod,
          path: event.path,
          queryStringParameters: event.queryStringParameters,
          headers: Object.keys(event.headers || {})
        }
      })
    }
  } catch (error) {
    console.error('Test function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test function failed',
        details: error.message
      })
    }
  }
}