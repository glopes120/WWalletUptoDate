import { useState, useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { supabase } from '../supabaseClient';
import AIFinancialInsights from './AIFinancialInsights';

import './Budget.css';

ChartJS.register(ArcElement, Tooltip, Legend);

// Function to generate deterministic colors based on string
const generateColorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

const pieOptions = {
  plugins: {
    legend: {
      display: false,
    },
  },
  cutout: '70%',
};

export default function Budget({ 
  expenses = [], 
  categories = [], 
  budgets = [], 
  incomeCategoryId,
  user,
  setView,
  onDataRefresh,
  onNotification
}) {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');

  const { 
    totalIncome, 
    totalExpenses, 
    recentTransactions,
    budgetCategories 
  } = useMemo(() => {
    let income = 0;
    const expenseMap = new Map();
    const categoryDetails = new Map();

    categories.forEach(cat => {
      categoryDetails.set(cat.id, { name: cat.name, color: generateColorFromString(cat.name) });
    });

    const validExpenses = Array.isArray(expenses) ? expenses : [];
    validExpenses.forEach(tx => {
      if (tx.category_id === incomeCategoryId) {
        income += tx.amount;
      } else {
        const currentSpent = expenseMap.get(tx.category_id) || 0;
        expenseMap.set(tx.category_id, currentSpent + tx.amount);
      }
    });

    const expenseTotal = Array.from(expenseMap.values()).reduce((sum, spent) => sum + spent, 0);

    const finalBudgetCategories = Array.from(categoryDetails.entries())
      .filter(([id]) => id !== incomeCategoryId)
      .map(([id, details]) => {
        const budgetInfo = budgets.find(b => b.category_id === id);
        return {
          id,
          name: details.name,
          spent: expenseMap.get(id) || 0,
          budget: budgetInfo ? budgetInfo.amount : 0,
          color: details.color,
        };
      });
      
    const sortedTransactions = [...validExpenses]
        .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date))
        .map(tx => ({
            ...tx,
            categoryName: categoryDetails.get(tx.category_id)?.name || 'Uncategorized'
        }));


    return { 
      totalIncome: income, 
      totalExpenses: expenseTotal,
      recentTransactions: sortedTransactions.slice(0, 5),
      budgetCategories: finalBudgetCategories
    };
  }, [expenses, categories, budgets, incomeCategoryId]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!user) {
      onNotification({ title: 'Error', message: 'You must be logged in.', type: 'error' });
      return;
    }
    if (!newCategoryName.trim()) {
      onNotification({ title: 'Error', message: 'Category name cannot be empty.', type: 'error' });
      return;
    }
    const budgetAmount = parseFloat(newCategoryBudget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      onNotification({ title: 'Error', message: 'Please enter a valid budget amount.', type: 'error' });
      return;
    }

    try {
      // 1. Create the new category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert({ name: newCategoryName.trim() })
        .select();

      if (categoryError) throw categoryError;
      if (!categoryData || categoryData.length === 0) throw new Error("Failed to create category.");
      
      const newCategoryId = categoryData[0].id;

      // 2. Create the new budget for that category
      const { error: budgetError } = await supabase
        .from('budgets')
        .insert({ user_id: user.id, category_id: newCategoryId, amount: budgetAmount });

      if (budgetError) throw budgetError;

      onNotification({ title: 'Success', message: `Category '${newCategoryName}' added.`, type: 'success' });
      setShowAddCategory(false);
      setNewCategoryName('');
      setNewCategoryBudget('');
      onDataRefresh(); // Trigger data refresh in dashboard
    } catch (error) {
      console.error("Error adding category:", error);
      onNotification({ title: 'Error', message: error.message || 'Could not add category.', type: 'error' });
    }
  };


  const remaining = totalIncome - totalExpenses;
  const budgetProgress = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;

  const pieData = {
    labels: budgetCategories.map(c => c.name),
    datasets: [{
      data: budgetCategories.map(c => c.spent),
      backgroundColor: budgetCategories.map(c => c.color),
      borderColor: '#1f2937',
      borderWidth: 2,
    }],
  };

  const getProgressBarClass = (progress) => {
    if (progress > 90) return 'progress-bar-danger';
    if (progress > 70) return 'progress-bar-warning';
    return 'progress-bar-safe';
  }

  return (
    <div className="budget-container">
      <div className="budget-header">
        <h1 className="budget-title">Budget Management</h1>
        <div className="header-actions">
          <button onClick={() => setShowAddCategory(true)} className="add-category-button">
            + Add Category
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="summary-section">
          <h2 className="summary-title">Monthly Summary</h2>
          <div className="summary-item">
            <span className="summary-label">Income</span>
            <span className="summary-value summary-income">${totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Expenses</span>
            <span className="summary-value summary-expense">${totalExpenses.toFixed(2)}</span>
          </div>
          <div className="summary-item summary-divider">
            <span className="summary-label">Remaining</span>
            <span className="summary-value summary-remaining">${remaining.toFixed(2)}</span>
          </div>
          <div className="budget-progress-container">
            <div className="progress-header">
              <span className="progress-label">Budget Progress</span>
              <span className="progress-percentage">{budgetProgress}% used</span>
            </div>
            <div className="progress-bar-wrapper">
              <div 
                className={`progress-bar ${getProgressBarClass(budgetProgress)}`} 
                style={{'--progress-width': `${budgetProgress}%`, width: `${budgetProgress}%`}} 
              />
            </div>
          </div>
        </div>

        <div className="pie-chart-section">
          <h2 className="summary-title">Spending by Category</h2>
          <div className="pie-chart-content">
            <div style={{width: '140px', height: '140px'}}>
              <Pie data={pieData} options={pieOptions} />
            </div>
            <div className="pie-legend">
              {budgetCategories.map((c) => (
                <div key={c.id} className="pie-legend-item">
                  <span className="pie-legend-dot" style={{ backgroundColor: c.color }} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="categories-section">
        <h2 className="summary-title">Budget Categories</h2>
        {budgetCategories.map((cat) => {
          const progress = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
          const overBudget = cat.budget > 0 && cat.spent > cat.budget;
          return (
            <div key={cat.id} className="category-item">
              <div className="category-header">
                <div className="category-name-wrapper">
                  <span className="category-dot" style={{ backgroundColor: cat.color }} />
                  <span className="category-name">{cat.name}</span>
                </div>
                <div className="category-amounts">
                  <span className={overBudget ? 'category-spent-over' : 'category-spent'}>${cat.spent.toFixed(2)}</span>
                  <span className="category-budget"> / ${cat.budget.toFixed(2)}</span>
                </div>
              </div>
              <div className="category-progress-wrapper">
                <div className="category-progress-bar">
                  <div 
                    className={`category-progress-fill ${overBudget ? 'category-progress-fill-over' : 'category-progress-fill-normal'}`}
                    style={{ '--category-color': cat.color, width: `${Math.min(100, progress)}%` }} 
                  />
                </div>
                <span className={`category-percentage ${overBudget ? 'category-percentage-over' : 'category-percentage-normal'}`}>{progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid-2">
        <div className="transactions-section">
          <h2 className="summary-title">Recent Transactions</h2>
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <div className={`transaction-icon ${tx.category_id === incomeCategoryId ? 'transaction-icon-income' : 'transaction-icon-expense'}`}>
                {tx.category_id === incomeCategoryId ? '📥' : '📤'}
              </div>
              <div className="transaction-details">
                <p className="transaction-name">{tx.description}</p>
                <p className="transaction-category">{tx.categoryName}</p>
              </div>
              <div className="transaction-amount-wrapper">
                <p className={`transaction-amount ${tx.category_id === incomeCategoryId ? 'transaction-amount-income' : 'transaction-amount-expense'}`}>
                  {tx.category_id === incomeCategoryId ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                </p>
                <p className="transaction-date">{new Date(tx.expense_date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          <button className="view-all-button" onClick={() => setView('History')}>View All Transactions</button>
        </div>

        <div className="insights-section">
            <h2 className="summary-title">Budget Insights</h2>
            <AIFinancialInsights />
        </div>
      </div>

      {showAddCategory && (
        <div className="modal-backdrop" onClick={() => setShowAddCategory(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add Budget Category</h2>
            <form className="modal-form" onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="form-label" htmlFor="categoryName">Category Name</label>
                <input 
                  id="categoryName" 
                  className="form-input" 
                  placeholder="e.g., Subscriptions" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="monthlyBudget">Monthly Budget ($)</label>
                <input 
                  id="monthlyBudget" 
                  type="number" 
                  className="form-input" 
                  placeholder="100" 
                  value={newCategoryBudget}
                  onChange={(e) => setNewCategoryBudget(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddCategory(false)} className="modal-button-cancel">Cancel</button>
                <button type="submit" className="modal-button-submit">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}