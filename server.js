import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 3002;

// ------------------------------------------------------------------
// CONFIGURAÇÕES
// ------------------------------------------------------------------

// 1. Supabase - MUDANÇA IMPORTANTE:
// Tenta usar a SERVICE_ROLE_KEY primeiro. Se não existir, usa a ANON_KEY (mas a ANON pode falhar em backend).
const supabaseUrl = process.env.SUPABASE_URL || 'https://uczfpbyaedxytlulxisw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.warn("AVISO: Nenhuma chave do Supabase encontrada. Verifique o seu ficheiro .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// 3. Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(express.json());
app.use(cors());

// ------------------------------------------------------------------
// ROTAS
// ------------------------------------------------------------------

// Rota 1: Processamento de Texto com IA (Gemini)
app.post('/gemini-parse', async (req, res) => {
    const { text } = req.body;
    console.log('[/gemini-parse] Recebido texto:', text);

    if (!text) {
        return res.status(400).json({ error: 'Texto não fornecido.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

        const prompt = `
            Analyze the text to extract transaction details.
            Return ONLY a single JSON object inside a markdown code block.
            The JSON object must have: 'type' ('expense' or 'income'), 'amount' (number), 'description' (string), and 'category' (string).
            - 'description' should be a single, concise Portuguese word.
            - 'category' should be a concise English word (e.g. "Food", "Salary"). Use 'Uncategorized' if unsure.
            - Default to 'expense' if type is unclear.
            
            Text: "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const geminiText = response.text();

        // Extração robusta do JSON
        const jsonMatch = geminiText.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch || !jsonMatch[1]) throw new Error('Formato inválido do Gemini');

        const parsedTransaction = JSON.parse(jsonMatch[1].trim());
        res.status(200).json(parsedTransaction);

    } catch (error) {
        console.error('[/gemini-parse] Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota 2: Insights Financeiros (Gemini)
app.post('/api/advice', async (req, res) => {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID obrigatório.' });

    try {
        // Busca despesas recentes
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount, description, category_id, expense_date')
            .eq('user_id', userId)
            .order('expense_date', { ascending: false })
            .limit(20);

        if (expensesError) throw expensesError;

        // Busca nomes das categorias
        const { data: categories } = await supabase.from('categories').select('id, name');
        const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

        const formattedTransactions = expenses.map(exp => ({
            ...exp,
            category: categoryMap.get(exp.category_id) || 'Unknown',
            date: new Date(exp.expense_date).toLocaleDateString()
        }));

        const prompt = `
            Analyze these financial transactions and provide 3 short, actionable insights/tips in Portuguese.
            Format as a list.
            Data: ${JSON.stringify(formattedTransactions)}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Limpa a formatação para devolver apenas o texto das linhas
        const insights = response.text().split('\n')
            .filter(line => line.trim().length > 0 && (/^\d+\./.test(line) || line.startsWith('-')))
            .map(line => line.replace(/^[\d-]+\.\s*/, '').trim());

        res.status(200).json({ insights });

    } catch (error) {
        console.error('[/gemini-insights] Erro:', error);
        res.status(500).json({ error: 'Falha ao gerar insights.' });
    }
});

// Rota 3: Login Simples (Legado)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'user@exemplo.com' && password === 'senha123') {
        res.status(200).json({ success: true, message: 'Login realizado!' });
    } else {
        res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }
});

// Rota 4: Enviar Relatório Mensal (RESEND)
app.post('/send-monthly-report', async (req, res) => {
    const { userId, userEmail, userName } = req.body;

    console.log(`[/send-monthly-report] A preparar envio para: ${userEmail}`);

    if (!userId || !userEmail) {
        return res.status(400).json({ error: 'User ID e Email são obrigatórios.' });
    }

    try {
        // --- Passo A: Obter dados do Supabase ---
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        // Buscar transações do mês
        const { data: expenses, error: expError } = await supabase
            .from('expenses')
            .select('amount, category_id')
            .eq('user_id', userId)
            .gte('expense_date', startOfMonth)
            .lte('expense_date', endOfMonth);

        if (expError) throw expError;

        // Buscar categorias para saber qual é "Income"
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id, name');
        
        if (catError) throw catError;

        // --- Passo B: Calcular Totais ---
        const incomeCat = categories.find(c => c.name.trim().toLowerCase() === 'income');
        const incomeId = incomeCat ? incomeCat.id : null;

        let totalIncome = 0;
        let totalExpense = 0;

        expenses.forEach(tx => {
            if (tx.category_id === incomeId) {
                totalIncome += tx.amount;
            } else {
                totalExpense += tx.amount;
            }
        });

        const balance = totalIncome - totalExpense;
        const monthName = today.toLocaleString('pt-PT', { month: 'long' });

        // --- Passo C: Construir HTML do Email ---
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #6c5ce7;">Relatório de ${monthName}</h1>
                <p>Olá <strong>${userName}</strong>, aqui está o teu resumo:</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <p><strong>Entradas:</strong> <span style="color: #00b894;">€${totalIncome.toFixed(2)}</span></p>
                    <p><strong>Saídas:</strong> <span style="color: #d63031;">€${totalExpense.toFixed(2)}</span></p>
                    <hr>
                    <p style="font-size: 1.2em;"><strong>Saldo:</strong> 
                        <span style="color: ${balance >= 0 ? '#00b894' : '#d63031'}">€${balance.toFixed(2)}</span>
                    </p>
                </div>
                <p style="color: #636e72; font-size: 12px; margin-top: 20px;">WiseWallet App</p>
            </div>
        `;

        // --- Passo D: Enviar com Resend ---
        // NOTA DE DEBUG: Se estiver no plano Gratuito do Resend, só pode enviar para
        // o SEU PRÓPRIO EMAIL (o que usou para criar a conta Resend).
        // Se 'userEmail' for diferente, o envio falhará com erro 403.
        
        const data = await resend.emails.send({
            from: 'WiseWallet <onboarding@resend.dev>',
            to: ['guilermelopes279@gmail.com'], // <-- Mude para ['seu_email@gmail.com'] se estiver a testar e der erro
            subject: `Relatório Financeiro - ${monthName}`,
            html: htmlContent,
        });

        if (data.error) {
            console.error('Erro Resend:', data.error);
            return res.status(500).json({ error: data.error });
        }

        console.log('Email enviado com sucesso:', data);
        res.status(200).json({ success: true, data });

    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------------

// Servir os ficheiros estáticos da build do React
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

// Rota "catch-all" para garantir que o React Router funciona
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ Servidor a correr na porta ${port}`);
});