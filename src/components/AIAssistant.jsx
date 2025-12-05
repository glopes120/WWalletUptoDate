import React, { useState, useEffect, useRef } from 'react';
import './AIAssistant.css';

const AIAssistant = ({ onTransactionAdd }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const conversationEndRef = useRef(null);

  // Adapting conversation state to match the new UI's message format { role: 'user' | 'assistant', content: string, isConfirmation?: boolean }
  const [conversation, setConversation] = useState([
    { role: 'assistant', content: "Olá! Sou o seu Assistente Financeiro. Posso ajudar a adicionar transações, por exemplo: 'Gastei 25 euros em café'." }
  ]);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  useEffect(() => {
    // Automatically scroll to the latest message
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const callGeminiAPI = async (text) => {
    const response = await fetch('/gemini-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Server returned an invalid error format',
        details: `HTTP error! status: ${response.status}`
      }));
      throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const addUserMessage = (text) => {
    setConversation(prev => [...prev, { role: 'user', content: text }]);
  };

  const addAiMessage = (text, isConfirmation = false) => {
    setConversation(prev => [...prev, { role: 'assistant', content: text, isConfirmation }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    addUserMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    console.log('inputValue before API call:', inputValue); // Debugging
    console.log('userMessage before API call:', userMessage); // Debugging

    try {
      const parsedData = await callGeminiAPI(userMessage);

      if (parsedData && parsedData.amount !== undefined && parsedData.description) {
        // Ensure the category is included if provided by Gemini
        const categoryDisplay = parsedData.category ? `for "${parsedData.category}"` : '';
        const confirmationText = `Entendi um(a) ${parsedData.type} de €${parsedData.amount} para "${parsedData.description}" ${categoryDisplay}. Devo adicionar esta transação?`;
        addAiMessage(confirmationText, true);
        setPendingTransaction(parsedData);
      } else {
        addAiMessage("Desculpe, não entendi bem. Poderia reformular?");
      }
    } catch (error) {
      console.error('Erro ao processar transação:', error);
      if (error.message.includes('Gemini')) {
        addAiMessage("Estou com problemas para conectar ao serviço de IA. Por favor, tente novamente em um momento.");
      } else {
        addAiMessage("Ocorreu um erro ao tentar entender isso. Por favor, tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmation = async (confirm) => {
    if (!pendingTransaction) return;

    // Disable the confirmation buttons in the UI
    setConversation(prev => prev.map(msg => msg.isConfirmation ? { ...msg, isConfirmation: false } : msg));

    if (confirm) {
      addUserMessage("Sim, por favor.");
      setIsLoading(true);
      try {
        await onTransactionAdd(pendingTransaction);
        addAiMessage("Ótimo! Adicionei a transação para você.");
      } catch (error) {
        addAiMessage("Houve um problema ao adicionar a transação. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    } else {
      addUserMessage("Não, cancelar.");
      addAiMessage("Ok, cancelei a solicitação.");
    }
    setPendingTransaction(null);
  };

  return (
    <div className="ai-assistant-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-icon">
            <span>🤖</span>
          </div>
          <div>
            <h3 className="chat-title">Assistente Financeiro AI</h3>
            <p className="chat-subtitle">Pergunte-me qualquer coisa sobre suas finanças</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-area">
        {conversation.map((msg, i) => (
          <div key={i} className={`message-wrapper ${msg.role === 'user' ? 'user' : 'assistant'}`}>
            <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
              {msg.role === 'assistant' && (
                <div className="assistant-label">
                  <span className="assistant-icon">🤖</span>
                  <span className="assistant-name">AI Assistente</span>
                </div>
              )}
              <p className="message-content">{msg.content}</p>
              {msg.isConfirmation && pendingTransaction && ( // Only show confirmation buttons if it's the latest message and there's a pending transaction
                <div className="confirmation-buttons">
                  <button onClick={() => handleConfirmation(true)} className="confirm-button" disabled={isLoading}>Confirmar</button>
                  <button onClick={() => handleConfirmation(false)} className="cancel-button" disabled={isLoading}>Cancelar</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="message-wrapper assistant">
                <div className="message-bubble assistant-bubble">
                    <div className="assistant-label">
                        <span className="assistant-icon">🤖</span>
                        <span className="assistant-name">AI Assistente</span>
                    </div>
                    <p className="message-content">...</p>
                </div>
            </div>
        )}
        <div ref={conversationEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Adicione uma transação ou faça uma pergunta..."
            disabled={isLoading}
            aria-label="Chatbot Input"
            className="chat-input-field"
          />
          <button 
            type="submit" 
            onClick={handleSubmit}
            className="chat-send-button"
            disabled={isLoading || !inputValue.trim()}
          >
            <svg className="send-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        {/* Suggestion buttons could be added here if desired */}
        {/*
        <div className="chat-suggestions">
            {['💰 Dicas de poupança', '📈 Aconselhamento de investimento', '🎯 Planeamento de objetivos'].map((suggestion, i) => (
                <button 
                    key={i}
                    onClick={() => setInputValue(suggestion)}
                    className="suggestion-button"
                >
                    {suggestion}
                </button>
            ))}
        </div>
        */}
      </div>
    </div>
  );
};

export default AIAssistant;