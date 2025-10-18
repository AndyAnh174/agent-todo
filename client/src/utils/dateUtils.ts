/**
 * Date utility functions for todo management
 */

export const isOverdue = (dueTime: string | null | undefined): boolean => {
  if (!dueTime) return false;
  
  try {
    const dueDate = new Date(dueTime);
    const now = new Date();
    
    // Set both dates to start of day for accurate comparison
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return dueDateOnly < todayOnly;
  } catch (error) {
    console.error('Error parsing due date:', error);
    return false;
  }
};

export const isDueToday = (dueTime: string | null | undefined): boolean => {
  if (!dueTime) return false;
  
  try {
    const dueDate = new Date(dueTime);
    const now = new Date();
    
    return (
      dueDate.getFullYear() === now.getFullYear() &&
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getDate() === now.getDate()
    );
  } catch (error) {
    console.error('Error parsing due date:', error);
    return false;
  }
};

export const isDueTomorrow = (dueTime: string | null | undefined): boolean => {
  if (!dueTime) return false;
  
  try {
    const dueDate = new Date(dueTime);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return (
      dueDate.getFullYear() === tomorrow.getFullYear() &&
      dueDate.getMonth() === tomorrow.getMonth() &&
      dueDate.getDate() === tomorrow.getDate()
    );
  } catch (error) {
    console.error('Error parsing due date:', error);
    return false;
  }
};

export const getDueDateStatus = (dueTime: string | null | undefined): 'overdue' | 'today' | 'tomorrow' | 'future' | 'none' => {
  if (!dueTime) return 'none';
  
  if (isOverdue(dueTime)) return 'overdue';
  if (isDueToday(dueTime)) return 'today';
  if (isDueTomorrow(dueTime)) return 'tomorrow';
  
  return 'future';
};

export const formatDueDate = (dueTime: string | null | undefined): string => {
  if (!dueTime) return '';
  
  try {
    const date = new Date(dueTime);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  } catch (error) {
    console.error('Error formatting due date:', error);
    return '';
  }
};
