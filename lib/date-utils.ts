export const weeklyIntervals = generateWeeklyIntervals();

function generateWeeklyIntervals(weeks: number = 52) {
  const intervals = [];
  const today = new Date();
  
  for (let i = 0; i < weeks; i++) {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - (today.getDay() + 1 + (7 * i)));
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    
    intervals.push({
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      value: `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`
    });
  }
  
  return intervals;
} 