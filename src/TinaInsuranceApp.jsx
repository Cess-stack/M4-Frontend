import React, { useState, useRef, useEffect } from 'react';
import './TinaInsuranceApp.css'; 

export default function TinaInsuranceApp() {
  const [chat, setChat] = useState([
    {
      speaker: 'AI',
      text: 'I’m Tina. I help you choose the right car insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBoxRef = useRef(null);

  const API_URL = 'http://localhost:3000/api/insurance';

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    const updatedChat = [...chat, { speaker: 'User', text: userInput }];
    setChat(updatedChat);
    setUserInput('');
    setIsTyping(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: updatedChat }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.response || 'Network error');
      }

      const data = await res.json();
      setChat([...updatedChat, { speaker: 'AI', text: data.response }]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setChat([
        ...updatedChat,
        { speaker: 'AI', text: 'Sorry, something went wrong getting AI response.' }
      ]);
    }

    setIsTyping(false);
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div className="container">
      <h1 className="title">Tina – Insurance Chatbot</h1>

      <div ref={chatBoxRef} className="chatBox">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={msg.speaker === 'User' ? 'messageUser' : 'messageAI'}
          >
            <strong>{msg.speaker}:</strong> {msg.text}
          </div>
        ))}

        {isTyping && (
          <div className="typingIndicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex' }}>
        <input
          type="text"
          placeholder="Your answer"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          className="inputAnswer"
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <button
          onClick={handleSubmit}
          className="submitBtn"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
