import { createClient } from '@supabase/supabase-js';

// Inicialização do cliente Supabase
// Mantemos fora do handler para reutilizar a conexão em chamadas subsequentes (performance)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

export const handler = async (event, context) => {
  // 1. Headers para permitir CORS (acesso de qualquer origem durante desenvolvimento)
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*' 
  };

  try {
    // 2. Extração segura dos parâmetros da URL
    const params = event.queryStringParameters || {};
    
    // IMPORTANTE: Conversão para Inteiro. 
    // O Postgres é estrito: se a coluna é int4, não devemos enviar strings.
    const expenseId = params.id ? parseInt(params.id) : null;
    const categoryId = params.category ? parseInt(params.category) : null;

    // 3. Construção da Query Base na tabela 'expenses'
    // Fazemos o SELECT dos dados da despesa E os dados da categoria relacionada
    let query = supabase
      .from('expenses')
      .select(`
        id, 
        description, 
        amount, 
        expense_date,
        categories ( id, name, color )
      `);

    // 4. Aplicação dos Filtros
    if (expenseId && !isNaN(expenseId)) {
      // Cenário A: Filtrar por ID de despesa (retorna apenas 1 objeto)
      query = query.eq('id', expenseId).single();

    } else if (categoryId && !isNaN(categoryId)) {
      // Cenário B: Filtrar por Categoria
      // AQUI ESTÁ O PONTO CRÍTICO:
      // O primeiro argumento de .eq() deve ser o nome da coluna NA TABELA EXPENSES.
      // Baseado na imagem 1, é muito provável que seja 'category_id'.
      // Se der erro, tenta mudar 'category_id' para 'category'.
      query = query
        .eq('category_id', categoryId) 
        .order('expense_date', { ascending: false });

    } else {
      // Cenário C: Listar todas as despesas (limitado às últimas 20)
      query = query
        .order('expense_date', { ascending: false })
        .limit(20);
    }

    // 5. Execução da Query
    const { data, error } = await query;

    // Se houver erro no Supabase (ex: nome da coluna errado), lançamos a exceção
    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    // Log detalhado para o teu painel do servidor (Netlify/Vercel)
    console.error("Erro no Webservice:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        hint: "Verifique se o nome da coluna no código ('category_id') bate certo com a tabela 'expenses'."
      }),
    };
  }
};
