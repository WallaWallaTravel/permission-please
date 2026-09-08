import { GET as runReminders } from '../reminders/route';

// Leftover path. Vercel Cron hits GET /api/cron/reminders (see vercel.json).
export const GET = runReminders;
export const POST = runReminders;
