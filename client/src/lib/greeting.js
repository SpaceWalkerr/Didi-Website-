/** Time-of-day greeting key, from the visitor's own clock. */
export function greetingKey(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'greeting.morning';
  if (h >= 12 && h < 17) return 'greeting.afternoon';
  if (h >= 17 && h < 22) return 'greeting.evening';
  return 'greeting.night';
}
