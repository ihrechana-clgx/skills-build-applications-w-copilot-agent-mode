import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load activities'));
  }, []);

  return (
    <section>
      <h2>Activities</h2>
      {error && <section role="alert" className="alert alert-danger">Unable to load activities: {error}</section>}
      {activities === null && !error && <section role="status" className="alert alert-info">Loading activities...</section>}
      {activities !== null && activities.length === 0 && <p className="alert alert-secondary">No activities yet.</p>}
      {activities !== null && activities.length > 0 && (
        <div className="row">
          {activities.map((activity, idx) => (
            <div key={idx} className="col-md-6 col-lg-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h3 className="h5">{activity.type}</h3>
                  <p className="mb-1"><strong>{activity.minutes}</strong> minutes</p>
                  <p><strong>{activity.points}</strong> points</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
