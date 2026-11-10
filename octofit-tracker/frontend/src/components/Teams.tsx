import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id: string; name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load teams'));
  }, []);

  return (
    <section>
      <h2>Teams</h2>
      {error && <section role="alert" className="alert alert-danger">Unable to load teams: {error}</section>}
      {teams === null && !error && <section role="status" className="alert alert-info">Loading teams...</section>}
      {teams !== null && teams.length === 0 && <p className="alert alert-secondary">No teams yet.</p>}
      {teams !== null && teams.length > 0 && (
        <div className="row">
          {teams.map((team) => (
            <div key={team._id} className="col-md-6 col-lg-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h3 className="h5">{team.name}</h3>
                  <p className="mb-0"><strong>{team.members.length}</strong> members</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
