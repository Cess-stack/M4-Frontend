import React, { useState, useRef, useEffect } from 'react';
import './TinaInsuranceApp.css';

const ageGroups = ['Under 18', '18-25', '26-40', '41-60', 'Over 60'];
const insuranceOptions = [
  'Mechanical Breakdown Insurance (MBI)',
  'Comprehensive Insurance',
  'Third Party Insurance',
];

export default function TinaInsuranceApp() {
  const [chat, setChat] = useState([
    {
      speaker: 'AI',
      text:
        "I’m Tina. I help you choose the right car insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?",
    },
  ]);
  const [stage, setStage] = useState('consent');
  const [ageGroup, setAgeGroup] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState([]);
  const [vehicleDetails, setVehicleDetails] = useState({ make: '', model: '', year: '' });
  const [additionalInfo, setAdditionalInfo] = useState('');  // NEW STATE
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const chatBoxRef = useRef(null);

  const addMessage = (msg) => setChat((prev) => [...prev, msg]);

  const handleConsent = (agree) => {
    addMessage({ speaker: 'User', text: agree ? 'Yes' : 'No' });
    if (agree) {
      addMessage({ speaker: 'AI', text: 'Great! Please select your age group.' });
      setStage('askAge');
    } else {
      addMessage({ speaker: 'AI', text: 'Okay, feel free to ask me anytime!' });
      setStage('done');
    }
  };

  const handleAgeGroupSelect = (selected) => {
    setAgeGroup(selected);
    addMessage({ speaker: 'User', text: selected });
    addMessage({ speaker: 'AI', text: 'Which insurance types interest you? Select all that apply.' });
    setStage('askInsurance');
  };

  const toggleInsuranceOption = (option) => {
    setSelectedInsurance((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const handleInsuranceSubmit = () => {
    if (selectedInsurance.length === 0) return;
    addMessage({ speaker: 'User', text: selectedInsurance.join(', ') });
    addMessage({
      speaker: 'AI',
      text: 'Great! Now, to help me recommend the best policy, could you tell me a little more about your vehicle? What make, model, and year is it?',
    });
    setStage('askVehicle');
  };

  // UPDATED: Ask for additional info instead of summary after vehicle details submit
  const handleVehicleDetailsSubmit = () => {
    const { make, model, year } = vehicleDetails;
    if (!make || !model || !year) return;
    addMessage({ speaker: 'User', text: `${make} ${model}, ${year}` });
    // Instead of summary, ask additional info now
    addMessage({
      speaker: 'AI',
      text:
        `Great! A ${year} ${make} ${model}. Do you need to insure other vehicles as well? And will this car be used primarily for personal or business purposes?`,
    });
    setStage('askAdditional');
  };

  const handleAdditionalInfoSubmit = () => {
    if (!additionalInfo.trim()) return;
    addMessage({ speaker: 'User', text: additionalInfo.trim() });
    setAdditionalInfo('');
    setStage('readyForQuote');
  };  

  const handleConfirm = async () => {
    setIsTyping(true);
    setSummaryVisible(false);
    addMessage({
      speaker: 'AI',
      text: 'Thanks! Let me analyze your answers and recommend the best policy...',
    });
    const systemPrompt = `
    You are Tina, a friendly and helpful virtual car insurance consultant.
    
    Start every session by saying:
    "Im Tina. I help you choose the right car insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?"
    
    Only continue if the user agrees.
    
    Your goal is to recommend the most suitable insurance product(s) out of the following:
    - Mechanical Breakdown Insurance (MBI): Covers repair or replacement of mechanical components due to failure or wear and tear. Not available for trucks or racing cars.
    - Comprehensive Car Insurance: Covers damage to the user's car, theft, natural disasters, and more. Only available for vehicles under 10 years old.
    - Third Party Car Insurance: Covers damage caused to other people's property or vehicles.
    
    Ask thoughtful, dynamic questions to learn about the user's needs and situation (already completed).
    
    Now, based on the following user profile, recommend the best policy or combination of policies, and explain why each is suitable:
    
    User Profile:
    - Age Group: ${ageGroup}
    - Insurance Interests: ${selectedInsurance.join(', ')}
    - Vehicle: ${vehicleDetails.make} ${vehicleDetails.model}, ${vehicleDetails.year}
    - Additional Info: ${additionalInfo}
    
    Use a friendly tone, and **only include one clear estimated monthly cost** (e.g., "$85 - $120/month") at the end.
    `;
    
    const historyForBackend = [...chat, { speaker: 'User', text: systemPrompt }];
    
    try {
      const res = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: historyForBackend }),
      });

      if (!res.ok) throw new Error((await res.json()).response || 'Network error');

      const data = await res.json();
      addMessage({ speaker: 'AI', text: data.response });
      setStage('nextSteps');
    } catch (error) {
      console.error('AI response error:', error);
      addMessage({ speaker: 'AI', text: 'Sorry, something went wrong getting the AI response.' });
      setStage('done');
    } finally {
      setIsTyping(false);
    }
  };

  const handleRestart = () => {
    setChat([
      {
        speaker: 'AI',
        text:
          "I’m Tina. I help you choose the right car insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?",
      },
    ]);
    setStage('consent');
    setAgeGroup('');
    setSelectedInsurance([]);
    setVehicleDetails({ make: '', model: '', year: '' });
    setAdditionalInfo('');
    setUserInput('');
    setIsTyping(false);
    setSummaryVisible(false);
  };

  const handleSendUserInput = () => {
    const input = userInput.trim();
    if (!input) return;
    addMessage({ speaker: 'User', text: input });
    setUserInput('');
    setIsTyping(true);
    setTimeout(() => {
      addMessage({ speaker: 'AI', text: `Thanks for your message: "${input}"` });
      setIsTyping(false);
    }, 1200);
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const showUserTextInput = ['summary', 'done', 'chat'].includes(stage);

  return (
    <div className="container">
      <h1 className="title">Tina – Insurance Chatbot</h1>

      <div ref={chatBoxRef} className="chatBox">
        {chat.map((msg, i) => (
          <div key={i} className={msg.speaker === 'User' ? 'messageUser' : 'messageAI'}>
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

      {stage === 'consent' && (
        <div className="buttonGroup">
          <button className="submitBtn" onClick={() => handleConsent(true)}>Yes</button>
          <button className="submitBtn" onClick={() => handleConsent(false)}>No</button>
        </div>
      )}

      {stage === 'askAge' && (
        <select className="inputAnswer" value={ageGroup} onChange={(e) => handleAgeGroupSelect(e.target.value)}>
          <option value="" disabled>Select your age group</option>
          {ageGroups.map((age) => (
            <option key={age} value={age}>{age}</option>
          ))}
        </select>
      )}

      {stage === 'askInsurance' && (
        <div className="checkboxGroup">
          {insuranceOptions.map((opt) => (
            <label key={opt} className="checkboxItem">
              <input
                type="checkbox"
                checked={selectedInsurance.includes(opt)}
                onChange={() => toggleInsuranceOption(opt)}
              />
              {opt}
            </label>
          ))}
          <button className="submitBtn" onClick={handleInsuranceSubmit} disabled={selectedInsurance.length === 0}>
            Submit
          </button>
        </div>
      )}

      {stage === 'askVehicle' && (
        <div className="inputRow vehicleForm">
          <input
            className="inputAnswer"
            placeholder="Make (e.g., Toyota)"
            value={vehicleDetails.make}
            onChange={(e) => setVehicleDetails({ ...vehicleDetails, make: e.target.value })}
          />
          <input
            className="inputAnswer"
            placeholder="Model (e.g., Corolla)"
            value={vehicleDetails.model}
            onChange={(e) => setVehicleDetails({ ...vehicleDetails, model: e.target.value })}
          />
          <input
            className="inputAnswer"
            placeholder="Year (e.g., 2015)"
            value={vehicleDetails.year}
            onChange={(e) => setVehicleDetails({ ...vehicleDetails, year: e.target.value })}
          />
          <button className="submitBtn" onClick={handleVehicleDetailsSubmit}>Submit Vehicle Info</button>
        </div>
      )}

      {/* NEW STAGE: Ask Additional Info */}
      {stage === 'askAdditional' && (
        <div className="inputRow">
          <input
            className="inputAnswer"
            type="text"
            placeholder="Type your answer here..."
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdditionalInfoSubmit()}
          />
          <button className="submitBtn" onClick={handleAdditionalInfoSubmit}>Submit</button>
        </div>
      )}

{stage === 'readyForQuote' && (
  <div className="buttonGroup">
    <button className="submitBtn" onClick={handleConfirm}>
      Get My Quote
    </button>
  </div>
)}

      {summaryVisible && (
        <div className="summaryBox">
          <h4>Summary of your answers:</h4>
          <p><strong>Age group:</strong> {ageGroup}</p>
          <p><strong>Insurance types:</strong> {selectedInsurance.join(', ')}</p>
          <p><strong>Vehicle:</strong> {vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.year})</p>
        </div>
      )}

      {stage === 'nextSteps' && (
        <div className="buttonGroup">
          <button className="submitBtn" onClick={handleRestart}>Start Over</button>
        </div>
      )}

      {showUserTextInput && (
        <div className="inputRow">
          <input
            className="inputAnswer"
            type="text"
            placeholder="Type a message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendUserInput()}
          />
          <button className="submitBtn" onClick={handleSendUserInput}>Send</button>
        </div>
      )}
    </div>
  );
}
