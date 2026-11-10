import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid input'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (!userId || !teamId || !type || minutes === undefined) {
    throw Object.assign(new Error('Missing required fields'), { status: 400 });
  }

  if (typeof userId !== 'string' || typeof teamId !== 'string' || typeof type !== 'string' || typeof minutes !== 'number') {
    throw Object.assign(new Error('Invalid field types'), { status: 400 });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 404 });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      throw Object.assign(new Error('Team not found'), { status: 404 });
    }

    const points = calculatePoints(type, minutes);
    const activity = await Activity.create({
      user: userId,
      team: teamId,
      type,
      minutes,
      points,
      occurredAt: new Date(),
    });

    return activity.toObject();
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    throw Object.assign(new Error('Invalid ObjectId'), { status: 400 });
  }
}

function calculatePoints(type: string, minutes: number): number {
  const basePointsPerMinute: Record<string, number> = {
    run: 1,
    cycle: 0.8,
    strength: 1.5,
    swim: 1.2,
  };
  const pointsPerMinute = basePointsPerMinute[type] || 1;
  return Math.round(minutes * pointsPerMinute);
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid input'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Name and mascot are required'), { status: 400 });
  }

  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))) {
    throw Object.assign(new Error('Members must be valid user IDs'), { status: 400 });
  }

  const existingMembers = await User.countDocuments({ _id: { $in: members } });
  if (existingMembers !== members.length) {
    throw Object.assign(new Error('One or more members were not found'), { status: 400 });
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).select('name').lean();
  const teamNames = new Map(teams.map(({ _id, name }) => [_id.toString(), name]));

  return totals.flatMap(({ _id, totalPoints }, index) => {
    const teamName = teamNames.get(_id.toString());
    return teamName ? [{ teamName, totalPoints, rank: index + 1 }] : [];
  });
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const workouts = await Workout.find({ focus: user.fitnessGoal }).lean();
  return workouts.map((workout) => ({
    ...workout,
    reason: `Recommended for your ${user.fitnessGoal} goal and activity.`,
  }));
}

export { User };
