import React, { useState, useCallback, useEffect } from "react";

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
    } catch (error) {
      setError(error.message);
      setResult(null);
    }
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold mb-4">Secret Santa Organizer</h1>

      <div className="mb-4">
        <input
          type="text"
          autoCapitalize="on"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addParticipant();
            }
          }}
          placeholder="Participant Name"
          className="w-full p-2 mb-2 border rounded"
        />
        <button
          onClick={addParticipant}
          disabled={!newName}
          className={`w-full p-2 text-white rounded ${
            newName
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Add Participant
        </button>
      </div>

      <ul className="mb-4">
        {participants.map((p, index) => (
          <li key={index} className="mb-1 flex justify-between items-center">
            <span>{p}</span>
            <button
              onClick={() => removeParticipant(p)}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {participants.length > 1 && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Previous Year's Matches</h2>
          <select
            value={previousGiver}
            onChange={(e) => setPreviousGiver(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
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
            className="w-full p-2 mb-2 border rounded"
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
            className={`w-full p-2 text-white rounded ${
              previousGiver && previousReceiver
                ? "bg-purple-500 hover:bg-purple-600"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Add Previous Match
          </button>
        </div>
      )}

      {Object.keys(previousPairings).length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold mb-2">Previous Matches:</h3>
          <ul>
            {Object.entries(previousPairings).map(([giver, receivers]) => (
              <li key={giver}>
                {giver} →
                {receivers.map((receiver) => (
                  <span key={receiver} className="mx-2">
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

      <button
        onClick={organizeSecretSanta}
        disabled={participants.length < 2}
        className={`w-full p-2 text-white rounded ${
          participants.length >= 2
            ? "bg-green-500 hover:bg-green-600"
            : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        Organize Secret Santa
      </button>

      <button
        onClick={clearAllData}
        className="w-full mt-4 p-2 text-white bg-red-500 rounded hover:bg-red-600"
      >
        Clear All Data
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Results:</h2>
          <ul>
            {result.map((pair, index) => (
              <li key={index} className="mb-1">
                {pair.giver} → {pair.receiver}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SecretSantaApp;
