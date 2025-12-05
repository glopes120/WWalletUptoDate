import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Categories.css';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('category_id');

      if (expensesError) throw expensesError;

      const usedCategoryIds = new Set(expensesData.map(exp => exp.category_id));

      const categoriesWithDeletableFlag = categoriesData.map(cat => ({
        ...cat,
        is_deletable: !usedCategoryIds.has(cat.id),
      }));

      setCategories(categoriesWithDeletableFlag || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('Category name cannot be empty.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }])
        .select();

      if (error) throw error;

      const newCategory = { ...data[0], is_deletable: true };
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;

        setCategories(categories.filter(cat => cat.id !== categoryId));
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="categories-container">
      <h3>Manage Categories</h3>
      
      <form onSubmit={handleAddCategory} className="add-category-form">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New category name"
          required
        />
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <ul className="categories-list">
          {categories.map(cat => (
            <li key={cat.id} className="category-item">
              <span>{cat.name}</span>
              <button 
                onClick={() => handleDeleteCategory(cat.id)} 
                className="delete-btn"
                disabled={!cat.is_deletable}
                title={!cat.is_deletable ? "This category is in use and cannot be deleted." : "Delete category"}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Categories;