import React, { useState, useCallback, useEffect } from "react";
import './SnowAnimation.css';

function generateSecretSantaPairs(participants, previousPairings) {
  const shuffled = [...participants];
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let isValid = true;
    for (let i = 0; i < participants.length; i++) {
      const giver = participants[i];
      const receiver = shuffled[i];

      if (
        giver === receiver ||
        (previousPairings[giver] && previousPairings[giver].includes(receiver))
      ) {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      return participants.map((giver, index) => ({
        giver,
        receiver: shuffled[index],
      }));
    }

    attempts++;
  }

  throw new Error(
    "Unable to generate valid Secret Santa pairings after maximum attempts"
  );
}

function SecretSantaApp() {
  const [participants, setParticipants] = useState(() => {
    const saved = localStorage.getItem("secretSantaParticipants");
    console.log("Initial load - participants:", saved);
    return saved ? JSON.parse(saved) : [];
  });

  const [previousPairings, setPreviousPairings] = useState(() => {
    const saved = localStorage.getItem("secretSantaPreviousPairings");
    console.log("Initial load - previous pairings:", saved);
    return saved ? JSON.parse(saved) : {};
  });

  const [newName, setNewName] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previousGiver, setPreviousGiver] = useState("");
  const [previousReceiver, setPreviousReceiver] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    console.log("Saving participants to localStorage:", participants);
    localStorage.setItem(
      "secretSantaParticipants",
      JSON.stringify(participants)
    );
  }, [participants]);

  useEffect(() => {
    console.log("Saving previous pairings to localStorage:", previousPairings);
    localStorage.setItem(
      "secretSantaPreviousPairings",
      JSON.stringify(previousPairings)
    );
  }, [previousPairings]);

  const addParticipant = () => {
    if (newName) {
      if (participants.includes(newName)) {
        setError("A participant with this name already exists.");
        return;
      }
      setParticipants((prev) => {
        const updated = [...prev, newName];
        console.log("Adding participant, new state:", updated);
        return updated;
      });
      setNewName("");
      setError(null);
    }
  };

  const removeParticipant = useCallback((nameToRemove) => {
    setParticipants((prev) => {
      const updated = prev.filter((p) => p !== nameToRemove);
      console.log("Removing participant, new state:", updated);
      return updated;
    });
    setPreviousPairings((prev) => {
      const newPairings = { ...prev };
      delete newPairings[nameToRemove];
      Object.keys(newPairings).forEach((giver) => {
        newPairings[giver] = newPairings[giver].filter(
          (receiver) => receiver !== nameToRemove
        );
        if (newPairings[giver].length === 0) {
          delete newPairings[giver];
        }
      });
      console.log(
        "Updating previous pairings after removal, new state:",
        newPairings
      );
      return newPairings;
    });
  }, []);

  const addPreviousPairing = () => {
    if (
      previousGiver &&
      previousReceiver &&
      previousGiver !== previousReceiver
    ) {
      if (previousPairings[previousGiver]?.includes(previousReceiver)) {
        setError("This pairing already exists.");
        return;
      }
      setPreviousPairings((prev) => {
        const updated = {
          ...prev,
          [previousGiver]: [...(prev[previousGiver] || []), previousReceiver],
        };
        console.log("Adding previous pairing, new state:", updated);
        return updated;
      });
      setPreviousGiver("");
      setPreviousReceiver("");
      setError(null);
    }
  };

  const removePreviousPairing = useCallback((giver, receiver) => {
    setPreviousPairings((prev) => {
      const newPairings = { ...prev };
      newPairings[giver] = newPairings[giver].filter((r) => r !== receiver);
      if (newPairings[giver].length === 0) {
        delete newPairings[giver];
      }
      console.log("Removing previous pairing, new state:", newPairings);
      return newPairings;
    });
  }, []);

const organizeSecretSanta = () => {
  try {
    const pairings = generateSecretSantaPairs(participants, previousPairings);
    setResult(pairings);
    setError(null);
    setShowResults(true); // Add this line
  } catch (error) {
    setError(error.message);
    setResult(null);
  }
};

const returnToForm = () => {
  setShowResults(false);
  setResult(null);
};

  const clearAllData = () => {
    setParticipants([]);
    setPreviousPairings({});
    setResult(null);
    setError(null);
    localStorage.removeItem("secretSantaParticipants");
    localStorage.removeItem("secretSantaPreviousPairings");
    console.log("All data cleared from localStorage");
  };

 return (
   <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
     <div className="snow"></div>
     <div className="snow"></div>
     <div className="snow"></div>
     <div className="snow"></div>
     <div className="snow"></div>
     <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-xl shadow-md relative z-10">
       <h1 className="text-3xl font-extrabold text-center shimmering-title mb-6">
         Secret Santa Generator
       </h1>

        {showResults ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">Results:</h2>
            <ul className="space-y-2">
              {result.map((pair, index) => (
                <li key={index} className="bg-green-100 p-3 rounded-md">
                  {pair.giver} → {pair.receiver}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={returnToForm}
            className="w-full p-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Return to Form
          </button>
        </div>
      ) : (
        // Wrap all your existing form content in this else block
        <div>
       <div className="space-y-4">
         <input
           type="text"
           value={newName}
           onChange={(e) => setNewName(e.target.value)}
           onKeyDown={(e) => {
             if (e.key === "Enter") {
               addParticipant();
             }
           }}
           placeholder="Participant Name"
           className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
         />
         <button
           onClick={addParticipant}
           disabled={!newName}
           className={`w-full p-3 text-white rounded-md transition duration-200 ${
             newName
               ? "bg-blue-600 hover:bg-blue-700"
               : "bg-gray-400 cursor-not-allowed"
           }`}
         >
           Add Participant
         </button>
       </div>

       {participants.length > 0 && (
         <div className="mt-6">
           <h2 className="text-xl font-bold mb-3">Participants</h2>
           <ul className="space-y-2">
             {participants.map((p, index) => (
               <li
                 key={index}
                 className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
               >
                 <span>{p}</span>
                 <button
                   onClick={() => removeParticipant(p)}
                   className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-200"
                 >
                   Remove
                 </button>
               </li>
             ))}
           </ul>
         </div>
       )}

       {participants.length > 1 && (
         <div className="mt-6">
           <h2 className="text-xl font-bold mb-3">Previous Year's Matches</h2>
           <select
             value={previousGiver}
             onChange={(e) => setPreviousGiver(e.target.value)}
             className="w-full p-3 mb-2 border border-gray-300 rounded-md"
           >
             <option value="">Select Giver</option>
             {participants.map((p, index) => (
               <option key={index} value={p}>
                 {p}
               </option>
             ))}
           </select>
           <select
             value={previousReceiver}
             onChange={(e) => setPreviousReceiver(e.target.value)}
             className="w-full p-3 mb-2 border border-gray-300 rounded-md"
           >
             <option value="">Select Receiver</option>
             {participants
               .filter((p) => p !== previousGiver)
               .map((p, index) => (
                 <option key={index} value={p}>
                   {p}
                 </option>
               ))}
           </select>
           <button
             onClick={addPreviousPairing}
             disabled={!previousGiver || !previousReceiver}
             className={`w-full p-3 text-white rounded-md transition duration-200 ${
               previousGiver && previousReceiver
                 ? "bg-purple-600 hover:bg-purple-700"
                 : "bg-gray-400 cursor-not-allowed"
             }`}
           >
             Add Previous Match
           </button>
         </div>
       )}

       {Object.keys(previousPairings).length > 0 && (
         <div className="mt-6">
           <h3 className="font-bold mb-2">Previous Matches:</h3>
           <ul className="space-y-2">
             {Object.entries(previousPairings).map(([giver, receivers]) => (
               <li key={giver} className="bg-gray-100 p-3 rounded-md">
                 {giver} →
                 {receivers.map((receiver) => (
                   <span
                     key={receiver}
                     className="ml-2 inline-flex items-center"
                   >
                     {receiver}
                     <button
                       onClick={() => removePreviousPairing(giver, receiver)}
                       className="ml-1 text-red-500 hover:text-red-700"
                     >
                       ×
                     </button>
                   </span>
                 ))}
               </li>
             ))}
           </ul>
         </div>
       )}

       <div className="mt-6 space-y-4">
         <button
           onClick={organizeSecretSanta}
           disabled={participants.length < 2}
           className={`w-full p-3 text-white rounded-md transition duration-200 ${
             participants.length >= 2
               ? "bg-green-600 hover:bg-green-700"
               : "bg-gray-400 cursor-not-allowed"
           }`}
         >
           Generate Secret Santa
         </button>

         <button
           onClick={clearAllData}
           className="w-full p-3 text-white bg-red-600 rounded-md hover:bg-red-700 transition duration-200"
         >
           Clear All Data
         </button>
       </div>

       {error && (
         <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
           <h3 className="font-bold">Error</h3>
           <p>{error}</p>
         </div>
       )}
      </div>
      )}

     </div>
   </div>
 );
}

export default SecretSantaApp;
