import React, { useState, useEffect } from 'react';
import './AIFinancialInsights.css';
import { supabase } from '../supabaseClient';

const AIFinancialInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFinancialInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("User not logged in.");
          setLoading(false);
          return;
        }

        // In a real application, you would fetch relevant financial data
        // (e.g., expenses, income, budgets) for the user and send it to your backend.
        // For this example, we'll simulate fetching insights from a backend.

        // Simulate API call to a backend endpoint that uses Gemini to generate insights
        const response = await fetch('http://localhost:3002/api/advice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }), // Send user ID to backend
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setInsights(data.insights || []);

      } catch (err) {
        console.error('Error fetching AI financial insights:', err);
        setError('Failed to load AI financial insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialInsights();
  }, []);

  if (loading) return <p>Loading AI Financial Insights...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (insights.length === 0) return <p>No AI financial insights available yet.</p>;

  return (
    <>
      {insights.map((insight, index) => (
        <div key={index} className="card insight-item">
          <div>
            <h2>{insight.split('.')[0]}</h2> {/* Use first sentence as title */}
            <p>{insight}</p> {/* Use full insight as description */}
          </div>
          <a href="#" className="btn-html">Ação</a>
        </div>
      ))}
    </>
  );
};

export default AIFinancialInsights;
