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
  const [isSharedView, setIsSharedView] = useState(false);
const [eventTitle, setEventTitle] = useState(() => {
  const saved = localStorage.getItem("secretSantaEventTitle");
  return saved || "";
});

const [eventDate, setEventDate] = useState(() => {
  const saved = localStorage.getItem("secretSantaEventDate");
  return saved || "";
});

const [maxAmount, setMaxAmount] = useState(() => {
  const saved = localStorage.getItem("secretSantaMaxAmount");
  return saved || "";
});
const [revealClicks, setRevealClicks] = useState(0);
const [isWiggling, setIsWiggling] = useState(false);

const formatEventDate = (dateString) => {
  if (!dateString) return "";

  // Create a new date object using the date string with a specific time
  const date = new Date(`${dateString}T00:00:00`);

  // Get month, day, year components in local time
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  const year = date.getFullYear();

  // Format as MM/DD/YYYY
  return `${month}/${day}/${year}`;
};

// Modified handle click function
const handleRevealClick = () => {
  setIsWiggling(true);
  // Remove wiggle class after animation completes
  setTimeout(() => setIsWiggling(false), 300);

  if (revealClicks < revealMessages.length - 1) {
    setRevealClicks((prev) => prev + 1);
  } else {
    setRevealedPair(result.results.find((p) => p.giver === selectedViewer));
    setRevealClicks(0);
  }
};

// Array of fun messages
const revealMessages = [
  { text: "Are you sure that's you?", color: "bg-blue-600" },
  { text: "Have you been naughty or nice?", color: "bg-red-600" },
  { text: "Did you check your list twice?", color: "bg-green-600" },
  { text: "Do you believe in Christmas magic?", color: "bg-purple-600" },
  { text: "Promise to keep it a secret?", color: "bg-pink-600" },
  {
    text: "Reveal Your Match!",
    color: "bg-gradient-to-r from-red-500 to-green-500",
  },
];


  // Add this function to handle revealing a pair
  const revealPairForViewer = () => {
    const pair = result.results.find((p) => p.giver === selectedViewer);
    setRevealedPair(pair);
  };
  

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const compressed = params.get("r");

  if (compressed) {
    const decodedData = decompress(compressed);
    if (decodedData) {
      setResult(decodedData.results);
      setShowResults(true);
      setIsSharedView(decodedData.shared);
     // window.history.replaceState({}, "", window.location.pathname);
    }
  }
}, []);

  const saveResults = () => {
    const resultWithDate = {
      date: new Date().toISOString(),
      result: result,
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
      `Event Title: ${result.title}\n` +
      `Event Date: ${formatEventDate(result.date)}\n` +
      `Maximum Gift Amount: $${result.maxAmount}\n\n` +
      result.results.map((pair) => `${pair.giver} → ${pair.receiver}`).join("\n");

    const blob = new Blob([resultText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `secret-santa-${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

const compressWithViewType = (data, isShared = false) => {
  const dataWithType = {
    results: data,
    shared: isShared,
  };
  return compress(dataWithType);
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
  const compressed = compressWithViewType(result, true); // true for shared view
  const shareUrl = `${window.location.origin}${window.location.pathname}?r=${compressed}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Secret Santa Pairings",
        text: "Find out who you are Secret Santa for!",
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

  useEffect(() => {
    localStorage.setItem("secretSantaEventTitle", eventTitle);
  }, [eventTitle]);

  useEffect(() => {
    localStorage.setItem("secretSantaEventDate", eventDate);
  }, [eventDate]);

  useEffect(() => {
    localStorage.setItem("secretSantaMaxAmount", maxAmount);
  }, [maxAmount]);

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
    const eventData = {
      title: eventTitle || "Secret Santa",
      date: eventDate.split('T')[0],
      maxAmount: maxAmount,
      results: pairings,
    };
    setResult(eventData);
    setError(null);
    setShowResults(true); // Add this line
  } catch (error) {
    setError(error.message);
    setResult(null);
  }
};

const returnToForm = () => {
  setShowResults(false);
   setSelectedViewer("");
  setRevealedPair(null);
  // setResult(null);
};

const clearAllData = () => {
  setParticipants([]);
  setPreviousPairings({});
  setResult(null);
  setError(null);
  setSavedResults([]);
  setEventTitle("");
  setEventDate("");
  setMaxAmount("");
  localStorage.removeItem("secretSantaParticipants");
  localStorage.removeItem("secretSantaPreviousPairings");
  localStorage.removeItem("secretSantaResults");
    localStorage.removeItem("secretSantaEventTitle");
    localStorage.removeItem("secretSantaEventDate");
    localStorage.removeItem("secretSantaMaxAmount");
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
           <h3
             style={{
               fontSize: "24px",
               fontWeight: "bold",
               marginBottom: "12px",
               color: "#000000",
               textAlign: "center",
             }}
           >
             {result.title}
           </h3>
           {result.date && (
             <p
               style={{
                 fontSize: "18px",
                 color: "#000000",
                 textAlign: "center",
               }}
             >
               Date: {formatEventDate(result.date)}
             </p>
           )}
           {result.maxAmount && (
             <p
               style={{
                 fontSize: "18px",
                 color: "#000000",
                 textAlign: "center",
               }}
             >
               Maximum Gift Amount: ${result.maxAmount}
             </p>
           )}
           <h3
             style={{
               fontSize: "20px",
               fontWeight: "bold",
               marginBottom: "12px",
               color: "#000000",
               textAlign: "center",
             }}
           >
             Pairings
           </h3>
           <ul
             style={{ display: "flex", flexDirection: "column", gap: "12px" }}
           >
             {result.results.map((pair, index) => (
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
               {result.results.map((pair, index) => (
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
           <div className="bg-gray-50 p-4 rounded-md mb-4 shadow-md">
             <div className="flex items-center justify-center">
               <i className="text-2xl fas fa-gift text-red-500 mr-2"></i>
               <h2 className="text-2xl font-bold text-center mb-2">
                 {result.title}
               </h2>
               <i className="text-2xl fas fa-tree text-green-500 ml-2"></i>
             </div>
             {result.date && (
               <p className="text-center text-gray-600 mb-1">
                 Date: {formatEventDate(result.date)}
               </p>
             )}
             {result.maxAmount && (
               <p className="text-center text-gray-600">
                 Maximum Gift Amount: ${result.maxAmount}
               </p>
             )}
           </div>
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
               {result.results.map((pair, index) => (
                 <option key={index} value={pair.giver}>
                   {pair.giver}
                 </option>
               ))}
             </select>
           </div>

           {/*selectedViewer && !revealedPair && (
             <button
               onClick={revealPairForViewer}
               className="w-full p-3 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition duration-200"
             >
               Reveal Your Match!
             </button>
           ) */}

           {selectedViewer && !revealedPair && (
             <div className="space-y-2">
               <button
                 onClick={handleRevealClick}
                 className={`w-full p-3 text-white rounded-md transition-all duration-300 
        ${revealMessages[revealClicks].color} hover:opacity-90
        relative overflow-hidden ${isWiggling ? "wiggle" : ""}`}
               >
                 <div
                   className="absolute bottom-0 left-0 h-1 bg-white opacity-50"
                   style={{
                     width: `${
                       (revealClicks / (revealMessages.length - 1)) * 100
                     }%`,
                     transition: "width 0.3s ease-in-out",
                   }}
                 />

                 <span className="relative">
                   {revealMessages[revealClicks].text}
                 </span>
               </button>

               <p className="text-center text-sm text-gray-500 italic">
                 {revealClicks > 0 &&
                   revealClicks < revealMessages.length - 1 &&
                   `Only ${
                     revealMessages.length - revealClicks
                   } more clicks to go!`}
               </p>
             </div>
           )}
           {revealedPair && (
             <div className="bg-green-100 p-4 rounded-md text-center">
               <p className="text-sm text-gray-600 mb-2">
                 You are the Secret Santa for:
               </p>
               <p className="text-xl font-bold">{revealedPair.receiver}</p>
             </div>
           )}

           {isSharedView && (
             <button
               onClick={shareResults}
               className="w-full p-3 text-white bg-green-600 rounded-md hover:bg-green-700 transition duration-200 flex items-center justify-center"
             >
               Share Link
             </button>
           )}

           {!isSharedView && (
             <div>
               <div className="grid grid-cols-2 gap-2">
                 {/* <button
               onClick={saveResults}
               className="p-3 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition duration-200 flex items-center justify-center"
             >
               Save Results
             </button>
             */}

                 <button
                   onClick={exportResults}
                   className="p-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                 >
                   Download Results
                 </button>

                 <button
                   onClick={shareResults}
                   className="p-3 text-white bg-green-600 rounded-md hover:bg-green-700 transition duration-200 flex items-center justify-center"
                 >
                   Share Link
                 </button>
                 {/*  <button
               onClick={captureResults}
               className="p-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition duration-200"
             >
               Save as Image
             </button> */}
               </div>
               <button
                 onClick={returnToForm}
                 className="mt-3 w-full p-3 text-white bg-gray-600 rounded-md hover:bg-gray-700 transition duration-200 flex items-center justify-center"
               >
                 Return to Form
               </button>
             </div>
           )}
           {/*}
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
                       {saved.result.results.map((pair, pairIndex) => (
                         <li key={pairIndex} className="text-sm">
                           {pair.giver} → {pair.receiver}
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
             </div>
           )} */}
         </div>
       ) : (
         <div>
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Event Title
               </label>
               <input
                 type="text"
                 value={eventTitle}
                 onChange={(e) => setEventTitle(e.target.value)}
                 placeholder="Christmas 2024"
                 className="w-full p-2 border rounded-md"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Event Date
               </label>
               <input
                 type="date"
                 value={eventDate}
                 onChange={(e) => setEventDate(e.target.value)}
                 className="w-full p-2 border rounded-md"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Maximum Gift Amount
               </label>
               <div className="relative">
                 <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                   $
                 </span>
                 <input
                   type="number"
                   value={maxAmount}
                   onChange={(e) => setMaxAmount(e.target.value)}
                   placeholder="25"
                   className="w-full p-2 pl-8 border rounded-md"
                 />
               </div>
             </div>
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
             {result ? (
               // If results exist, show both options
               <div className="grid grid-cols-2 gap-2">
                 <button
                   onClick={organizeSecretSanta}
                   disabled={participants.length < 2}
                   className={`p-3 text-white rounded-md transition duration-200 ${
                     participants.length >= 2
                       ? "bg-green-600 hover:bg-green-700"
                       : "bg-gray-400 cursor-not-allowed"
                   }`}
                 >
                   Generate New
                 </button>
                 <button
                   onClick={() => setShowResults(true)}
                   className="p-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200"
                 >
                   View Existing
                 </button>
               </div>
             ) : (
               // If no results exist, show only generate button
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
             )}
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
