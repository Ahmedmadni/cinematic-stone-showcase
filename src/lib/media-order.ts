export type OrderableMedia = {
  id: string;
  section: string;
  sort_order: number;
  created_at: string;
};

export function compareMediaOrder(a: OrderableMedia, b: OrderableMedia) {
  return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);
}

export function normalizeMediaOrder<T extends OrderableMedia>(
  records: T[],
  sectionIds: readonly string[],
): T[] {
  const order = new Map<string, number>();
  for (const section of sectionIds) {
    records
      .filter((item) => item.section === section)
      .sort(compareMediaOrder)
      .forEach((item, index) => order.set(item.id, (index + 1) * 10));
  }
  return records.map((item) => ({ ...item, sort_order: order.get(item.id) ?? item.sort_order }));
}

export function placeMediaItem<T extends OrderableMedia>(
  records: T[],
  id: string,
  section: string,
  targetIndex: number,
  sectionIds: readonly string[],
): T[] {
  const source = records.find((item) => item.id === id);
  if (!source) return records;
  const moved = { ...source, section };
  const destination = records
    .filter((item) => item.section === section && item.id !== id)
    .sort(compareMediaOrder);
  destination.splice(Math.max(0, Math.min(targetIndex, destination.length)), 0, moved);
  const destinationOrder = new Map(
    destination.map((item, index) => [item.id, (index + 1) * 10] as const),
  );
  return normalizeMediaOrder(
    records.map((item) =>
      item.id === id
        ? { ...moved, sort_order: destinationOrder.get(item.id) ?? moved.sort_order }
        : item.section === section
          ? { ...item, sort_order: destinationOrder.get(item.id) ?? item.sort_order }
          : item,
    ),
    sectionIds,
  );
}

