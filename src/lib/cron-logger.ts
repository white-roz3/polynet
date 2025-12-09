// Supabase removed - cron logging disabled

export async function logCronRun(
  job: string,
  status: 'success' | 'error',
  details: any
) {
  // Supabase removed - logging to console only
  console.log(`[CRON] ${job}: ${status}`, details);
}

