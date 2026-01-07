/* Ficheiro: netlify/functions/api-expenses.js
  Descrição: Endpoint para listar despesas com suporte a filtro de categoria.
*/

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (lê as variáveis de ambiente do Netlify)
const supabaseUrl = process.env.VITE_SUPABASE_URL; 
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // 1. Headers para permitir acesso de qualquer lugar (CORS)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Se for um pedido OPTIONS (pre-flight do browser), responde logo OK
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 2. Ler parâmetros do URL (ex: ?category=Alimentação)
    const { category } = event.queryStringParameters || {};

    // 3. Iniciar a query base
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false }); // Ordenar por data (mais recente primeiro)

    // 4. Se houver categoria, aplicar o filtro
    if (category) {
      // Usa ilike para ignorar maiúsculas/minúsculas (Ex: 'food' encontra 'Food')
      // Os '%' permitem encontrar texto parcial se desejar
      query = query.ilike('category', `%${category}%`);
    }

    // Executar a query
    const { data, error } = await query;

    if (error) throw error;

    // 5. Retornar os dados
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Erro na API:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro ao buscar despesas', details: error.message })
    };
  }
};
