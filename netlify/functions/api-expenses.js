import { createClient } from '@supabase/supabase-js';

// Liga ao Supabase usando as chaves que já estão no Netlify
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

export const handler = async (event, context) => {
  // Apenas aceita pedidos GET (leitura)
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Busca as últimas 5 despesas
    const { data, error } = await supabase
      .from('expenses')
      .select('id, description, amount, date') // Campos simples para a demo
      .order('date', { ascending: false })
      .limit(5);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json', // OBRIGATÓRIO: Define que é JSON
        'Access-Control-Allow-Origin': '*'  // Permite acesso de qualquer lado
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};