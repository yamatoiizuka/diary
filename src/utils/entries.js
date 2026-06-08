import legacyEntries from "../data/entries.json";

const entryModules = import.meta.glob("../data/entries/*.json", {
  eager: true,
});

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const moduleEntries = Object.entries(entryModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([source, mod]) => ({
    source,
    value: mod?.default ?? mod,
  }));

const rawEntries =
  moduleEntries.length > 0
    ? moduleEntries
    : legacyEntries.map((entry, index) => ({
        source: `src/data/entries.json[${index}]`,
        value: entry,
      }));

const parseDateParts = (date, source) => {
  if (typeof date !== "string") {
    throw new Error(`Diary entry date must be a string: ${source}`);
  }

  const match = date.match(datePattern);
  if (!match) {
    throw new Error(`Diary entry date must use YYYY-MM-DD: ${source}`);
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, monthNumber - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== monthNumber - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Diary entry date is invalid: ${source}`);
  }

  return {
    year,
    month: monthNumber - 1,
    day,
  };
};

const normalizeEntry = ({ source, value }) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Diary entry must be an object: ${source}`);
  }

  const id = value.id ?? value.date;
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error(`Diary entry id must be a non-empty string: ${source}`);
  }

  if (typeof value.text !== "string") {
    throw new Error(`Diary entry text must be a string: ${source}`);
  }

  const dateParts = parseDateParts(value.date, source);

  return {
    ...value,
    id,
    image: value.image ?? id,
    ...dateParts,
  };
};

const normalizedEntries = rawEntries
  .map(normalizeEntry)
  .sort((a, b) => {
    const dateOrder = a.date.localeCompare(b.date);
    if (dateOrder !== 0) return dateOrder;

    const createdAtOrder = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    if (createdAtOrder !== 0) return createdAtOrder;

    return a.id.localeCompare(b.id);
  });

const ids = new Set();
for (const entry of normalizedEntries) {
  if (ids.has(entry.id)) {
    throw new Error(`Duplicate diary entry id: ${entry.id}`);
  }
  ids.add(entry.id);
}

export const getNormalizedDiaryEntries = () => normalizedEntries;

export const getDiaryEntryImageKey = (entry) => entry?.image ?? entry?.id;

export const getEntryMonthKey = (entry) =>
  `${entry.year}-${String(entry.month + 1).padStart(2, "0")}`;
