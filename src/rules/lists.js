export const toggled = (list, item) => list.includes(item) ? list.filter(one => one !== item) : list.concat(item);
