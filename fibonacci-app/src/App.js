import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const FibonacciApp = () => {
  const [index, setIndex] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/fibonacci/history`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    try {
      console.log(`Envoi de la requête à ${API_URL}/api/fibonacci/${index}`);
      const response = await fetch(`${API_URL}/api/fibonacci/${index}`);
      console.log('Statut de la réponse:', response.status);

      const text = await response.text();
      console.log('Texte de la réponse:', text);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = JSON.parse(text);
      setResult(data.result);
      fetchHistory(); // Mise à jour de l'historique après un nouveau calcul
    } catch (error) {
      console.error('Erreur lors de la récupération du résultat:', error);
      setError(error.message);
    }
  };

  return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Calculateur de Fibonacci</h1>
        <form onSubmit={handleSubmit} className="mb-4">
          <input
              type="number"
              value={index}
              onChange={(e) => setIndex(e.target.value)}
              placeholder="Entrez l'index"
              className="border p-2 mr-2"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Calculer
          </button>
        </form>
        {result !== null && (
            <p className="text-lg mb-4">
              Le {index}ème nombre de Fibonacci est : <strong>{result}</strong>
            </p>
        )}
        {error && (
            <p className="text-red-500 mb-4">Erreur : {error}</p>
        )}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Historique des calculs</h2>
          {history.length > 0 ? (
              <ul className="list-disc pl-5">
                {history.map((item) => (
                    <li key={item.index} className="mb-1">
                      Index {item.index}: <strong>{item.result}</strong>
                    </li>
                ))}
              </ul>
          ) : (
              <p>Aucun calcul précédent.</p>
          )}
        </div>
      </div>
  );
};

export default FibonacciApp;
