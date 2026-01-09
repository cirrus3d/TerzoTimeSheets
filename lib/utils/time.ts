export function calculateHours(clockIn: string, clockOut: string): number {
  const [inHour, inMinute] = clockIn.split(':').map(Number);
  const [outHour, outMinute] = clockOut.split(':').map(Number);
  
  const inMinutes = inHour * 60 + inMinute;
  const outMinutes = outHour * 60 + outMinute;
  
  let diffMinutes = outMinutes - inMinutes;
  
  // Handle cases where clock-out is the next day
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }
  
  return Number((diffMinutes / 60).toFixed(2));
}

export function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      times.push(`${h}:${m}`);
    }
  }
  return times;
}
