import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client
const app = express();
const port = 3002;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://uczfpbyaedxytlulxisw.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjemZwYnlhZWR4eXRsdWx4aXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTAxNjgsImV4cCI6MjA3Njg4NjE2OH0.7A_fuR3iK9sQJ3WjbFQkomsFgCnl169ObdP8zN4vAwE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware para o Express conseguir ler JSON vindo no corpo (body) dos pedidos
app.use(express.json());

app.use(cors()); // Permite todos os pedidos CORS. Simples e eficaz para desenvolvimento.

// Initialize Gemini
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

app.post('/gemini-parse', async (req, res) => {
    const { text } = req.body;
    console.log('[/gemini-parse] Received request with text:', text);

    if (!text) {
        console.log('[/gemini-parse] Failed: No text provided.');
        return res.status(400).json({ 
            error: 'No text provided in the request body.',
            details: 'The "text" field is mandatory.'
        });
    }

    try {
        // 1. Use the 'gemini-pro' model which is generally available.
        console.log('[/gemini-parse] Initializing model: gemini-pro-latest');
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

        // 2. Refined prompt for clarity and consistency.
        const prompt = `
            Analyze the text to extract transaction details.
            Return ONLY a single JSON object inside a markdown code block.
            The JSON object must have: 'type' ('expense' or 'income'), 'amount' (number), 'description' (string), and 'category' (string, e.g., "Food", "Salary").
            - 'description' should be a single, concise Portuguese word (e.g., "jantar", "salário").
            - 'category' should be a single, concise English word representing the category. If the AI is unsure, it can provide 'Uncategorized'.
            - Default to 'expense' if type is unclear.
            - Default to 0 if amount is unclear.
            - Default to 'Uncategorized' if description is unclear.
            - Default to 'Uncategorized' if category is unclear.

            Example 1: "Gastei 25 euros em jantar no restaurante X"
            \`\`\`json
            {"type": "expense", "amount": 25, "description": "jantar", "category": "Food"}
            \`\`\`

            Example 2: "Recebi 1200 do meu salário"
            \`\`\`json
            {"type": "income", "amount": 1200, "description": "salário", "category": "Salary"}
            \`\`\`

            Text: "${text}"
        `;

        console.log('[/gemini-parse] Generating content with Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const geminiText = response.text();
        console.log('[/gemini-parse] Received raw response from Gemini:', geminiText);

        // 3. Robust JSON extraction.
        const jsonMatch = geminiText.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch || !jsonMatch[1]) {
            console.error('[/gemini-parse] Failed: Gemini response did not contain a valid JSON code block.');
            throw new Error('Invalid response format from AI. Could not find JSON.');
        }

        const jsonString = jsonMatch[1].trim();
        
        // 4. Safe JSON parsing.
        try {
            const parsedTransaction = JSON.parse(jsonString);
            console.log('[/gemini-parse] Successfully parsed transaction:', parsedTransaction);
            res.status(200).json(parsedTransaction);
        } catch (jsonError) {
            console.error('[/gemini-parse] Failed: Could not parse JSON string:', jsonString, jsonError);
            throw new Error('Invalid JSON format in AI response.');
        }

    } catch (error) {
        console.error('[/gemini-parse] An error occurred:', error);
        
        // 5. Improved error response to the client.
        const isGoogleError = error.message.includes('GoogleGenerativeAI');
        const statusCode = error.status || 500;
        
        res.status(statusCode).json({
            error: 'Failed to process text with the AI service.',
            details: isGoogleError ? 'There is an issue with the connection to the AI provider.' : error.message,
            source: 'gemini-api-call'
        });
    }
});

app.post('/gemini-insights', async (req, res) => {
    const { userId } = req.body;
    console.log('[/gemini-insights] Received request for userId:', userId);

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        // Fetch user's financial data from Supabase
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount, description, category_id, expense_date')
            .eq('user_id', userId)
            .order('expense_date', { ascending: false })
            .limit(50); // Limit to recent 50 transactions for insights

        if (expensesError) throw expensesError;

        const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name');

        if (categoriesError) throw categoriesError;

        const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

        const formattedTransactions = expenses.map(exp => ({
            amount: exp.amount,
            description: exp.description,
            category: categoryMap.get(exp.category_id) || 'Uncategorized',
            date: new Date(exp.expense_date).toLocaleDateString('en-US'),
        }));

        // Fetch budgets
        const { data: budgets, error: budgetsError } = await supabase
            .from('budgets')
            .select('category_id, amount, start_date, end_date')
            .eq('user_id', userId);
        if (budgetsError) console.error('Error fetching budgets:', budgetsError.message);

        const formattedBudgets = budgets ? budgets.map(b => ({
            category: categoryMap.get(b.category_id) || 'Uncategorized',
            amount: b.amount,
            period: `${new Date(b.start_date).toLocaleDateString()} - ${new Date(b.end_date).toLocaleDateString()}`
        })) : [];

        // Fetch savings goals
        const { data: savingsGoals, error: savingsGoalsError } = await supabase
            .from('savings_goals')
            .select('name, target_amount, saved_amount, target_date')
            .eq('user_id', userId);
        if (savingsGoalsError) console.error('Error fetching savings goals:', savingsGoalsError.message);

        const formattedSavingsGoals = savingsGoals ? savingsGoals.map(sg => ({
            name: sg.name,
            target: sg.target_amount,
            saved: sg.saved_amount,
            progress: ((sg.saved_amount / sg.target_amount) * 100).toFixed(2) + '%',
            targetDate: new Date(sg.target_date).toLocaleDateString()
        })) : [];

        // Construct prompt for Gemini
        const prompt = `
            Analyze the following financial data for a user and provide 3-5 concise, actionable financial insights or recommendations.
            Focus on spending patterns, potential savings, budget adherence, and progress towards savings goals.
            Consider the user's overall financial health and suggest improvements.
            Present the insights as a numbered list of bullet points, each starting with a clear, actionable title.

            User's recent transactions:
            ${JSON.stringify(formattedTransactions, null, 2)}

            User's current budgets:
            ${JSON.stringify(formattedBudgets, null, 2)}

            User's savings goals:
            ${JSON.stringify(formattedSavingsGoals, null, 2)}

            Insights:
        `;

        console.log('[/gemini-insights] Generating content with Gemini...');
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const geminiText = response.text();
        console.log('[/gemini-insights] Received raw response from Gemini:', geminiText);

        // Parse Gemini's response into an array of insights
        const insights = geminiText.split('\n').filter(line => line.trim().length > 0 && /^\d+\./.test(line)).map(line => line.replace(/^\d+\.\s*/, ''));

        res.status(200).json({ insights });

    } catch (error) {
        console.error('[/gemini-insights] An error occurred:', error);
        res.status(500).json({
            error: 'Failed to generate financial insights.',
            details: error.message,
            source: 'gemini-insights-api'
        });
    }
});

// 1. Criar a rota (endpoint) que "ouve" por pedidos POST em /login
// Tem de ser o mesmo URL que usámos no fetch() do lado do cliente
app.post('/login', (req, res) => {
    
    // 2. Os dados enviados pelo cliente chegam em 'req.body'
    const { email, password } = req.body;

    console.log('Recebido pedido de login:');
    console.log('Email:', email);
    console.log('Password:', password);

    // 3. Lógica de Autenticação (Aqui é onde você verificaria na base de dados)
    // *** Este é apenas um exemplo simples - NUNCA faça isto em produção! ***
    if (email === 'user@exemplo.com' && password === 'senha123') {
        
        // 4. Enviar uma resposta de SUCESSO
        // O cliente (app-cliente.js) receberá este JSON
        res.status(200).json({ 
            success: true, 
            message: 'Login realizado com sucesso!' 
        });

    } else {
        
        // 5. Enviar uma resposta de ERRO
        res.status(401).json({ // 401 = Unauthorized
            success: false, 
            message: 'Email ou password inválidos.' 
        });
    }
});

// Servir os ficheiros estáticos da build do React (DEPOIS das rotas da API)
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

// Rota "catch-all" para servir o index.html para qualquer outra rota GET
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor a correr em http://localhost:${port}`);
});