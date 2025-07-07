/**
 * Formats execution time in seconds to a human-readable string
 * @param timeInSeconds - Execution time in seconds
 * @returns Formatted time string
 */
export function formatExecutionTime(timeInSeconds: number): string {
  if (timeInSeconds === 0 || timeInSeconds < 0.001) {
    return '~0';
  }
  
  if (timeInSeconds < 1) {
    // Convert to milliseconds for times less than 1 second
    const milliseconds = timeInSeconds * 1000;
    return `${milliseconds.toFixed(0)}ms`;
  }
  
  if (timeInSeconds < 60) {
    // Show in seconds for times less than 1 minute
    return `${timeInSeconds.toFixed(3)}s`;
  }
  
  if (timeInSeconds < 3600) {
    // Show in minutes and seconds for times less than 1 hour
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}m ${seconds}s`;
  }
  
  // Show in hours and minutes for times 1 hour or more
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
} 