import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

export const handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  // Ler parâmetros da URL (ex: ?id=15 ou ?category=10)
  const { id, category } = event.queryStringParameters;

  try {
    let query = supabase
      .from('expenses')
      .select(`
        id, 
        description, 
        amount, 
        expense_date,
        categories ( id, name, color )
      `);

    // Lógica de "Manipulação" da Pesquisa (Filtros)
    if (id) {
      // Cenário 1: Detalhes de UMA despesa (igual a /api/cidades/{id})
      query = query.eq('id', id).single();
    } else if (category) {
      // Cenário 2: Filtrar por Categoria (igual a /api/rotas/{origem})
      query = query.eq('category_id', category).order('expense_date', { ascending: false });
    } else {
      // Cenário 3: Listar Tudo (igual a /api/cidades)
      query = query.order('expense_date', { ascending: false }).limit(20);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};