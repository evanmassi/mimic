export const signed = n => (n >= 0 ? "+" : "−") + Math.abs(n);
export const shortDate = iso => new Date(iso).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});

const ORDINALS = ["", "1st", "2nd", "3rd"];
export const levelLabel = level => level === 0 ? "Cantrip" : `${ORDINALS[level] || level + "th"} level`;
