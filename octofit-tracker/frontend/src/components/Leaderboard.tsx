import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load leaderboard'));
  }, []);

  return (
    <section>
      <h2>Leaderboard</h2>
      {error && <section role="alert" className="alert alert-danger">Unable to load leaderboard: {error}</section>}
      {leaderboard === null && !error && <section role="status" className="alert alert-info">Loading leaderboard...</section>}
      {leaderboard !== null && leaderboard.length === 0 && <p className="alert alert-secondary">No leaderboard rankings yet.</p>}
      {leaderboard !== null && leaderboard.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.rank}>
                  <td>{entry.rank}</td>
                  <td>{entry.teamName}</td>
                  <td>{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
