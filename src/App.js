import React, { useState, useCallback, useEffect } from "react";
import './SnowAnimation.css';
import html2canvas from "html2canvas";

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
  const [savedResults, setSavedResults] = useState(() => {
    const saved = localStorage.getItem("secretSantaResults");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedViewer, setSelectedViewer] = useState("");
  const [revealedPair, setRevealedPair] = useState(null);

  // Add this function to handle revealing a pair
  const revealPairForViewer = () => {
    const pair = result.find((p) => p.giver === selectedViewer);
    setRevealedPair(pair);
  };
  

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const compressed = params.get("r");

  if (compressed) {
    const decodedResults = decompress(compressed);
    if (decodedResults) {
      setResult(decodedResults);
      setShowResults(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }
}, []);

  const saveResults = () => {
    const resultWithDate = {
      date: new Date().toISOString(),
      pairings: result,
    };
    setSavedResults((prev) => {
      const updated = [...prev, resultWithDate];
      localStorage.setItem("secretSantaResults", JSON.stringify(updated));
      return updated;
    });
  };

const captureResults = () => {
  // Show the screenshot version temporarily
  const screenshotVersion = document.querySelector("#screenshot-results");
  if (screenshotVersion) {
    screenshotVersion.style.display = "block";

    html2canvas(screenshotVersion, {
      backgroundColor: "#ffffff",
      scale: 2,
    }).then((canvas) => {
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `secret-santa-${new Date().toLocaleDateString()}.png`;
      link.href = image;
      link.click();

      // Hide the screenshot version again
      screenshotVersion.style.display = "none";
    });
  }
};

  const exportResults = () => {
    const resultText =
      `Secret Santa Pairings - ${new Date().toLocaleDateString()}\n\n` +
      result.map((pair) => `${pair.giver} → ${pair.receiver}`).join("\n");

    const blob = new Blob([resultText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `secret-santa-${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compress = (data) => {
    try {
      const stringified = JSON.stringify(data);
      // Convert to base64 and remove padding equals signs
      return btoa(stringified).replace(/=/g, "");
    } catch (e) {
      console.error("Compression failed:", e);
      return null;
    }
  };

  const decompress = (compressed) => {
    try {
      // Add back padding if needed
      const padded = compressed + "=".repeat((4 - (compressed.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch (e) {
      console.error("Decompression failed:", e);
      return null;
    }
  };

const shareResults = async () => {
  const compressed = compress(result);
  const shareUrl = `${window.location.origin}${window.location.pathname}?r=${compressed}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Secret Santa Pairings",
        text: "Check out our Secret Santa pairings!",
        url: shareUrl,
      });
    } catch (err) {
      await navigator.clipboard.writeText(shareUrl);
    }
  } else {
    await navigator.clipboard.writeText(shareUrl);
  }
};

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
  setSavedResults([]);
  localStorage.removeItem("secretSantaParticipants");
  localStorage.removeItem("secretSantaPreviousPairings");
  localStorage.removeItem("secretSantaResults");
  console.log("All data cleared from localStorage");
};

 return (
   <div className="min-h-screen bg-gray-900 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
     {!showResults ? (
       <button
         onClick={clearAllData}
         className="absolute top-4 right-4 p-3 text-white bg-red-600 rounded-md hover:bg-red-700 transition duration-200"
       >
         <i className="fas fa-undo"></i>
       </button>
     ) : null}
     <div className="snow"></div>
     <div className="snow"></div>
     <div className="snow"></div>
     <div className="snow"></div>
     <div className="snow"></div>
     {result && (
       <div
         id="screenshot-results"
         style={{
           display: "none",
           position: "fixed",
           left: "-9999px",
           backgroundColor: "#111827", // bg-gray-900
           padding: "48px",
           width: "800px",
         }}
       >
         <div
           style={{
             backgroundColor: "#ffffff",
             borderRadius: "12px",
             padding: "24px",
             boxShadow:
               "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
           }}
         >
           <h2
             style={{
               fontSize: "28px",
               fontWeight: "bold",
               marginBottom: "24px",
               color: "#000000",
               textAlign: "center",
             }}
           >
             Secret Santa Results
           </h2>
           <ul
             style={{ display: "flex", flexDirection: "column", gap: "12px" }}
           >
             {result.map((pair, index) => (
               <li
                 key={index}
                 style={{
                   backgroundColor: "#ecfdf5",
                   padding: "16px",
                   borderRadius: "8px",
                   color: "#000000",
                   fontSize: "18px",
                   textAlign: "center",
                   boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)", // Added drop shadow
                 }}
               >
                 <span style={{ fontWeight: "600" }}>{pair.giver}</span>
                 <span style={{ margin: "0 12px" }}>→</span>
                 <span style={{ fontWeight: "600" }}>{pair.receiver}</span>
               </li>
             ))}
           </ul>
         </div>
       </div>
     )}
     <div
       id="generator-card"
       className="max-w-md w-full space-y-8 bg-white p-6 rounded-xl shadow-md relative z-10"
     >
       <h1 className="text-3xl font-extrabold text-center shimmering-title mb-6">
         Secret Santa Generator
       </h1>

       {showResults ? (
         <div className="space-y-6">
           {/*
           <div>
             <h2 className="text-xl font-bold mb-3">Current Results:</h2>
             <ul className="space-y-2">
               {result.map((pair, index) => (
                 <li
                   key={index}
                   className="bg-green-100 shadow-md p-3 rounded-md text-lg"
                 >
                   {pair.giver} → {pair.receiver}
                 </li>
               ))}
             </ul>
           </div>
  */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Select your name
             </label>
             <select
               value={selectedViewer}
               onChange={(e) => {
                 setSelectedViewer(e.target.value);
                 setRevealedPair(null); // Reset revealed pair when changing selection
               }}
               className="w-full p-3 border border-gray-300 rounded-md"
             >
               <option value="">Choose your name</option>
               {result.map((pair, index) => (
                 <option key={index} value={pair.giver}>
                   {pair.giver}
                 </option>
               ))}
             </select>
           </div>

           {selectedViewer && !revealedPair && (
             <button
               onClick={revealPairForViewer}
               className="w-full p-3 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition duration-200"
             >
               Reveal Your Match!
             </button>
           )}

           {revealedPair && (
             <div className="bg-green-100 p-4 rounded-md text-center">
               <p className="text-sm text-gray-600 mb-2">
                 You are the Secret Santa for:
               </p>
               <p className="text-xl font-bold">{revealedPair.receiver}</p>
             </div>
           )}
{/*
           <div className="grid grid-cols-2 gap-2">
             <button
               onClick={saveResults}
               className="p-3 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition duration-200 flex items-center justify-center"
             >
               Save Results
             </button>

             <button
               onClick={exportResults}
               className="p-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center"
             >
               Download
             </button>

             <button
               onClick={shareResults}
               className="p-3 text-white bg-green-600 rounded-md hover:bg-green-700 transition duration-200 flex items-center justify-center"
             >
               Share Link
             </button>
             <button
               onClick={captureResults}
               className="p-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition duration-200"
             >
               Save as Image
             </button>
           </div>
*/}
           <button
             onClick={shareResults}
             className="w-full p-3 text-white bg-green-600 rounded-md hover:bg-green-700 transition duration-200 flex items-center justify-center"
           >
             Share Link
           </button>

           <button
             onClick={returnToForm}
             className="w-full p-3 text-white bg-gray-600 rounded-md hover:bg-gray-700 transition duration-200 flex items-center justify-center"
           >
             Return to Form
           </button>

           {savedResults.length > 0 && (
             <div className="mt-6">
               <h3 className="text-lg font-bold mb-2">Previous Results</h3>
               <div className="space-y-2 max-h-60 overflow-y-auto">
                 {savedResults.map((saved, index) => (
                   <div key={index} className="p-3 bg-gray-50 rounded-md">
                     <div className="font-medium text-gray-600 mb-2">
                       {new Date(saved.date).toLocaleDateString()} at{" "}
                       {new Date(saved.date).toLocaleTimeString()}
                     </div>
                     <ul className="space-y-1">
                       {saved.pairings.map((pair, pairIndex) => (
                         <li key={pairIndex} className="text-sm">
                           {pair.giver} → {pair.receiver}
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
       ) : (
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
                     className="flex justify-between items-center bg-gray-50 shadow-md p-3 rounded-md"
                   >
                     <span>{p}</span>
                     <button
                       onClick={() => removeParticipant(p)}
                       className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-200"
                     >
                       <i className="fas fa-trash-can"></i>
                     </button>
                   </li>
                 ))}
               </ul>
             </div>
           )}

           {participants.length > 1 && (
             <div className="mt-6">
               <h2 className="text-xl font-bold mb-3">
                 Previous Year's Matches
               </h2>
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
                   <li
                     key={giver}
                     className="bg-gray-50 shadow-md p-3 rounded-md"
                   >
                     {giver} →
                     {receivers.map((receiver) => (
                       <span
                         key={receiver}
                         className="ml-2 inline-flex items-center"
                       >
                         {receiver}
                         <button
                           onClick={() =>
                             removePreviousPairing(giver, receiver)
                           }
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
           </div>

           {error && (
             <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
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
