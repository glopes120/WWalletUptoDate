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

  try {
    const params = event.queryStringParameters || {};
    const expenseId = params.id ? parseInt(params.id) : null;
    const categoryId = params.category ? parseInt(params.category) : null;

    // --- CORREÇÃO AQUI ---
    // Alterámos o select para ser EXPLÍCITO na relação.
    // Sintaxe: "nome_tabela_destino!nome_coluna_local ( colunas )"
    // Isto força o Supabase a usar a coluna 'category_id' para fazer o JOIN.
    
    let query = supabase
      .from('expenses')
      .select(`
        id, 
        description, 
        amount, 
        expense_date,
        categories:category_id ( id, name, color ) 
      `);
      
      // NOTA: Se a tua coluna na tabela 'expenses' se chamar apenas 'category',
      // muda a linha acima para:  categories:category ( id, name, color )

    // Lógica de Filtros (Mantida igual, apenas garantindo o nome da coluna correto)
    if (expenseId && !isNaN(expenseId)) {
      query = query.eq('id', expenseId).single();
    } else if (categoryId && !isNaN(categoryId)) {
      // Aqui também usamos o nome correto da coluna
      query = query
        .eq('category_id', categoryId) 
        .order('expense_date', { ascending: false });
    } else {
      query = query
        .order('expense_date', { ascending: false })
        .limit(20);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro Supabase:", error);
        throw error;
    }

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
