export const startOfThisWeek = new Date();
startOfThisWeek.setHours(0, 0, 0, 0);
startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());

export const startOfLastWeek = new Date(startOfThisWeek);
startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

export const endOfLastWeek = new Date(startOfThisWeek);
endOfLastWeek.setMilliseconds(-1);