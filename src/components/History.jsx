
import React, { useState } from 'react';
import './History.css';
import CompletedSavingsGoals from './CompletedSavingsGoals.jsx';
import './CompletedSavingsGoals.css';

function History({ expenses, loading, incomeCategoryId }) {
  const [activeTab, setActiveTab] = useState('expenseHistory');

  if (loading) {
    return <div className="history-container"><h3>History</h3><p>Loading...</p></div>;
  }

  return (
    <div className="history-container">
      <h3>History</h3>
      <div className="history-tabs">
        <button
          className={activeTab === 'expenseHistory' ? 'active' : ''}
          onClick={() => setActiveTab('expenseHistory')}
        >
          Expense History
        </button>
        <button
          className={activeTab === 'completedGoals' ? 'active' : ''}
          onClick={() => setActiveTab('completedGoals')}
        >
          Goal Savings Finished
        </button>
      </div>

      {activeTab === 'expenseHistory' ? (
        expenses.length === 0 ? (
          <p>No transactions recorded yet.</p>
        ) : (
          <ul className="history-list">
            {expenses.map(expense => {
              const isIncome = expense.category_id === incomeCategoryId;
              const amountClassName = isIncome ? 'income-amount' : 'expense-amount';
              const amountPrefix = isIncome ? '+ ' : '- ';

              return (
                <li key={expense.id} className="history-item">
                  <div className="history-item-details">
                    <span className="history-item-description">{expense.description}</span>
                    <span className="history-item-date">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`history-item-amount ${amountClassName}`}>
                    {amountPrefix}€{expense.amount.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <CompletedSavingsGoals />
      )}
    </div>
  );
}

export default History;
