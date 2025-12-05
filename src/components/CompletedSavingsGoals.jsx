import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './CompletedSavingsGoals.css';

function CompletedSavingsGoals() {
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedGoals = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('completed_savings_goals')
          .select('id, goal_name, target_amount, completed_amount, completion_date')
          .eq('user_id', user.id)
          .order('completion_date', { ascending: false });

        if (error) throw error;

        setCompletedGoals(data || []);
      } catch (err) {
        console.error('Error fetching completed goals:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedGoals();
  }, []);

  if (loading) {
    return <div className="completed-goals-container"><h3>Completed Savings Goals</h3><p>Loading...</p></div>;
  }

  return (
    <div className="completed-goals-container">
      <h3>Completed Savings Goals</h3>
      {error && <p className="error-message">{error}</p>}
      {completedGoals.length === 0 ? (
        <p>No completed savings goals yet.</p>
      ) : (
        <ul className="completed-goals-list">
          {completedGoals.map(goal => (
            <li key={goal.id} className="completed-goal-item">
              <div className="goal-details">
                <span className="goal-name">{goal.goal_name}</span>
                <span className="goal-amount">€{goal.completed_amount.toFixed(2)} / €{goal.target_amount.toFixed(2)}</span>
              </div>
              <span className="completion-date">Completed on: {new Date(goal.completion_date).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CompletedSavingsGoals;
