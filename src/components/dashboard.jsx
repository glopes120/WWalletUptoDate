import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import './Dashboard.css'; // Import the new specific stylesheet
import History from './History.jsx';
import Budget from './Budget.jsx';
import Profile from './Profile.jsx';
import ResetData from './ResetData.jsx';
import Portfolio from './Portfolio.jsx';
import FinancialGoals from './FinancialGoals.jsx';
import AIAdvisor from './AIAdvisor.jsx';
import AIAssistant from './AIAssistant.jsx';
import Notification from './Notification.jsx';
import Modal from './Modal.jsx'; // Import the Modal component
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip } from 'recharts';
import AIFinancialInsights from './AIFinancialInsights.jsx';

// --- Placeholder data for charts ---
const netWorthData = [
  { month: 'Jan', value: 5000 }, { month: 'Feb', value: 18000 }, { month: 'Mar', value: 25000 },
  { month: 'Apr', value: 30000 }, { month: 'May', value: 33000 }, { month: 'Jun', value: 36000 },
  { month: 'Jul', value: 40000 }, { month: 'Aug', value: 43000 }, { month: 'Sep', value: 45000 },
  { month: 'Oct', value: 46500 }, { month: 'Nov', value: 48000 }, { month: 'Dec', value: 49460 }
];
const incomeExpenseData = [
  { month: 'Jul', income: 4500, expenses: 3200 }, { month: 'Aug', income: 4800, expenses: 3100 },
  { month: 'Sep', income: 4600, expenses: 3400 }, { month: 'Oct', income: 5000, expenses: 3300 },
  { month: 'Nov', income: 4900, expenses: 3500 }, { month: 'Dec', income: 5200, expenses: 3050 }
];
const spendingData = [
  { name: 'Housing', value: 40, color: '#3b82f6' },
  { name: 'Food', value: 14, color: '#22c55e' },
  { name: 'Transportation', value: 12, color: '#eab308' },
  { name: 'Utilities', value: 8, color: '#06b6d4' },
  { name: 'Entertainment', value: 6, color: '#f97316' },
  { name: 'Shopping', value: 12, color: '#ec4899' }
];
// --- End of placeholder data ---

function Dashboard({ view, setView }) { 
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [incomeCategoryId, setIncomeCategoryId] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [notification, setNotification] = useState(null);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [refreshAllData, setRefreshAllData] = useState(false);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name');
          if (categoriesError) throw categoriesError;
          const categories = categoriesData || [];
          setCategories(categories);
          
          const incomeCat = categories.find(c => c.name.toLowerCase() === 'income');
          if(incomeCat) setIncomeCategoryId(incomeCat.id);

          const { data: accountsData, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id);
          if (accountsError) throw accountsError;
          setAccounts(accountsData || []);
          
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*, categories(name)')
            .eq('user_id', user.id)
            .gte('expense_date', sixMonthsAgo.toISOString());
          if (expensesError) throw expensesError;
          setExpenses(expensesData || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setNotification({ title: 'Error', message: 'Failed to load dashboard data.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshAllData]);

  const { totalAssets, totalDebt, netWorth, spendingData, incomeExpenseData } = useMemo(() => {
    const assets = accounts.filter(a => a.type !== 'credit').reduce((sum, a) => sum + a.balance, 0);
    const debt = accounts.filter(a => a.type === 'credit').reduce((sum, a) => sum + a.balance, 0);
    
    // --- Spending Data Logic ---
    const spendingByCategory = new Map();
    const categoryColors = new Map();
    categories.forEach(cat => {
      let hash = 0;
      for (let i = 0; i < cat.name.length; i++) { hash = cat.name.charCodeAt(i) + ((hash << 5) - hash); }
      let color = '#';
      for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xFF; color += ('00' + value.toString(16)).substr(-2); }
      categoryColors.set(cat.id, color);
    });
    const expenseOnly = expenses.filter(e => e.category_id !== incomeCategoryId);
    const totalExpenseValue = expenseOnly.reduce((sum, e) => sum + e.amount, 0);
    expenseOnly.forEach(expense => {
      const catName = expense.categories?.name || 'Uncategorized';
      const currentSpent = spendingByCategory.get(catName) || 0;
      spendingByCategory.set(catName, currentSpent + expense.amount);
    });
    const spendingChartData = Array.from(spendingByCategory.entries()).map(([name, value]) => ({
      name,
      value: totalExpenseValue > 0 ? Math.round((value / totalExpenseValue) * 100) : 0,
      color: categoryColors.get(categories.find(c=>c.name === name)?.id) || '#8884d8'
    }));

    // --- Income/Expense Chart Logic ---
    const monthlyData = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    expenses.forEach(tx => {
        const month = monthNames[new Date(tx.expense_date).getMonth()];
        if (!monthlyData[month]) {
            monthlyData[month] = { month, income: 0, expenses: 0 };
        }
        if (tx.category_id === incomeCategoryId) {
            monthlyData[month].income += tx.amount;
        } else {
            monthlyData[month].expenses += tx.amount;
        }
    });
    const incomeExpenseChartData = Object.values(monthlyData);

    return {
        totalAssets: assets,
        totalDebt: debt,
        netWorth: assets - debt,
        spendingData: spendingChartData,
        incomeExpenseData: incomeExpenseChartData,
    };
  }, [accounts, expenses, categories, incomeCategoryId]);

  // --- NOVA FUNÇÃO PARA ENVIAR RELATÓRIO MENSAL ---
  const handleSendReport = async () => {
    if (!user) return;

    setNotification({ title: 'A enviar...', message: 'A gerar o seu relatório mensal.', type: 'info' });

    try {
      // Nota: Certifique-se que o backend está a correr em http://localhost:3002
      const response = await fetch('http://localhost:3002/send-monthly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email.split('@')[0]
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setNotification({ title: 'Sucesso!', message: 'Relatório enviado para o seu email.', type: 'success' });
      } else {
        throw new Error(result.error || 'Falha ao enviar email');
      }
    } catch (error) {
      console.error("Erro:", error);
      setNotification({ title: 'Erro', message: 'Não foi possível enviar o relatório. Verifique se o servidor está online.', type: 'error' });
    }
  };

  const renderMainContent = () => {
    switch (view.toLowerCase().replace(' ', '')) {
      case 'budget':
        return (
          <Budget
            expenses={expenses}
            loading={loading}
            incomeCategoryId={incomeCategoryId}
            categories={categories}
            budgets={budgets}
            user={user}
            setView={setView}
            onDataRefresh={() => setRefreshAllData(prev => !prev)}
            onNotification={setNotification}
          />
        );
      case 'history':
        return <History expenses={expenses} loading={loading} incomeCategoryId={incomeCategoryId} />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <ResetData />;
      case 'portfolio':
        return <Portfolio />;
      case 'financialgoals':
        return <FinancialGoals />;
      case 'aiadvisor':
        return <AIAdvisor />;
      case 'aiassistant':
        return renderDefaultDashboard(); 
      default:
        return renderDefaultDashboard();
    }
  };

  const renderDefaultDashboard = () => {
    const fmt = (val) => hideBalances ? '••••••' : `$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
      <div className="dashboard-container">
        <div className="header-card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem'}}>
            <div>
              <h1 className="header-title">Welcome back, {user?.email?.split('@')[0] || 'User'}!</h1>
              <p className="header-subtitle">Here's your financial overview</p>
            </div>
            <div className="header-icon">💰</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="stat-label">Total Assets</p>
              <p className="stat-value">{fmt(totalAssets)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Total Debt</p>
              <p className="stat-value">{fmt(totalDebt)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Net Worth</p>
              <p className="stat-value">{fmt(netWorth)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 mb-5">
          <div className="quick-stat-card">
            <div className="quick-stat-icon quick-stat-icon-emerald">📈</div>
            <div>
              <p className="quick-stat-title">Net Worth</p>
              <p className="quick-stat-desc">Your net worth increased by 2.3% this month</p>
            </div>
          </div>
          <div className="quick-stat-card">
            <div className="quick-stat-icon quick-stat-icon-purple">💸</div>
            <div>
              <p className="quick-stat-title">Spending</p>
              <p className="quick-stat-desc">You spent 12% less than last month</p>
            </div>
          </div>
          <div className="quick-stat-card">
            <div className="quick-stat-icon quick-stat-icon-blue">🎯</div>
            <div>
              <p className="quick-stat-title">Savings Rate</p>
              <p className="quick-stat-desc">You're saving 22% of your income</p>
            </div>
          </div>
        </div>
  
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="account-section">
            <div className="account-header">
              <h2 className="section-title">Your Accounts</h2>
              <button onClick={() => setHideBalances(!hideBalances)} className="hide-toggle">
                {hideBalances ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div className="account-list">
              {accounts.map((acc) => (
                <div key={acc.id} className="account-item">
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div className={`account-icon account-icon-${acc.type.toLowerCase()}`}>{acc.type === 'Checking' ? '💳' : '🏦'}</div>
                    <div>
                      <p className="account-name">{acc.name}</p>
                      <p className="account-type">{acc.type}</p>
                    </div>
                  </div>
                  <p className={`account-balance ${acc.balance < 0 ? 'balance-negative' : 'balance-positive'}`}>
                    {acc.balance < 0 ? '-' : ''}{fmt(acc.balance)}
                  </p>
                </div>
              ))}
            </div>
            <button className="button-outline" style={{width: '100%', marginTop: '1rem'}}>+ Add Account</button>
          </div>
  
          <div className="transaction-section">
            <div className="account-header">
              <h2 className="section-title">Recent Transactions</h2>
            </div>
            <div className="account-list">
              {expenses.map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div className={`transaction-icon transaction-icon-expense`}>🛒</div>
                    <div>
                      <p className="transaction-name">{tx.description}</p>
                      <p className="transaction-category">{tx.categories?.name || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <p className={`transaction-amount transaction-amount-expense`}>
                      -{fmt(tx.amount)}
                    </p>
                    <p className="transaction-date">{new Date(tx.expense_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="button-secondary" style={{width: '100%', marginTop: '1rem'}}>View All Transactions</button>
          </div>
        </div>
  
        <div className="chart-container mb-5">
          <h2 className="chart-title">Net Worth Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={netWorthData}><defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} /><Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} /><Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#grad)" /></AreaChart>
          </ResponsiveContainer>
        </div>
  
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="chart-container">
            <h2 className="chart-title">Income vs Expenses</h2>
            <ResponsiveContainer width="100%" height={180}><BarChart data={incomeExpenseData}><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} /><Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} /><Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} /><Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            <div className="bar-legend"><span className="bar-legend-item"><span className="bar-legend-square" style={{backgroundColor: '#22c55e'}} /> Income</span><span className="bar-legend-item"><span className="bar-legend-square" style={{backgroundColor: '#ef4444'}} /> Expenses</span></div>
          </div>
  
          <div className="chart-container">
            <h2 className="chart-title">Spending by Category</h2>
            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}><ResponsiveContainer width={140} height={140}><PieChart><Pie data={spendingData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">{spendingData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart></ResponsiveContainer>
              <div className="pie-legend">{spendingData.map((c, i) => (<div key={i} className="pie-legend-item"><span className="pie-legend-dot" style={{ background: c.color }} /><span>{c.name}: {c.value}%</span></div>))}</div>
            </div>
          </div>
        </div>
        
        <div className="insights-section">
          <div className="insights-header">
            <h2 className="section-title">AI Financial Insights</h2>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                {/* Botão de Relatório Mensal */}
                <button onClick={handleSendReport} className="button-secondary" style={{padding: '0.375rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
                    📧 Relatório
                </button>
                <button className="button-primary" style={{padding: '0.375rem 1rem', fontSize: '0.875rem'}}>✨ View All</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <AIFinancialInsights />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Notification notification={notification} onClear={() => setNotification(null)} />
      {renderMainContent()}

      <Modal
        isOpen={isAIAssistantModalOpen}
        onClose={() => {
          setIsAIAssistantModalOpen(false);
          setView('Dashboard'); // Navigate back to Dashboard when closing the modal
        }}
        title="AI Assistant"
      >
        <AIAssistant />
      </Modal>
    </>
  );
}

export default Dashboard;