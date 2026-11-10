import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { _id: string; title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load suggestions'));
  }, []);

  return (
    <section>
      <h2>Workout suggestions</h2>
      {error && <section role="alert" className="alert alert-danger">Unable to load workout suggestions: {error}</section>}
      {suggestions === null && !error && <section role="status" className="alert alert-info">Loading workout suggestions...</section>}
      {suggestions !== null && suggestions.length === 0 && <p className="alert alert-secondary">No workout suggestions available.</p>}
      {suggestions !== null && suggestions.length > 0 && (
        <div className="row">
          {suggestions.map((suggestion) => (
            <div key={suggestion._id} className="col-md-6 col-lg-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h3 className="h5">{suggestion.title}</h3>
                  <p className="mb-0">{suggestion.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
