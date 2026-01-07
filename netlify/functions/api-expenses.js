/* Ficheiro: netlify/functions/api-expenses.js
  Correção: Uso de ES Modules (import/export) e tratamento de erros melhorado.
*/

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL; 
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
  // 1. Headers para CORS (Permitir acesso do Frontend)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { category } = event.queryStringParameters || {};

    /* IMPORTANTE: Ajuste do SELECT
       Se a sua tabela de despesas tiver uma coluna 'category' com texto, use select('*').
       Se usar uma chave estrangeira (category_id), use select('*, categories(name)') para trazer o nome.
       Por defeito, mantivemos select('*') que funciona na maioria dos casos simples.
    */
    let query = supabase
      .from('expenses')
      .select('*') 
      .order('date', { ascending: false });

    // Filtro inteligente (Case Insensitive)
    // Ex: "ali" encontra "Alimentação", "ALIMENTAÇÃO", etc.
    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Erro na API:', error);
    return {
      statusCode: 500, // Erro de Servidor
      headers,
      body: JSON.stringify({ 
        error: 'Erro ao buscar dados.', 
        details: error.message 
      })
    };
  }
};
