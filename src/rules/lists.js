export const toggled = (list, item) => list.includes(item) ? list.filter(one => one !== item) : list.concat(item);
export const withItem = (list, item, isIn) => list.includes(item) === isIn ? list : toggled(list, item);
