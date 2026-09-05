import type { ObjectType } from "./types";

export const OBJECT_TYPE_RGB: Record<ObjectType, [number, number, number]> = {
  payload: [0.13, 0.83, 0.93],
  rocket_body: [0.96, 0.65, 0.14],
  debris: [0.96, 0.26, 0.37],
  unknown: [0.62, 0.7, 0.78],
};

export const OBJECT_TYPE_HEX: Record<ObjectType, string> = {
  payload: "#22d3ee",
  rocket_body: "#f5a524",
  debris: "#f43f5e",
  unknown: "#9aabc4",
};

export const OBJECT_TYPE_LEGEND: { id: ObjectType; label: string }[] = [
  { id: "payload", label: "PAYLOAD" },
  { id: "rocket_body", label: "R/B" },
  { id: "debris", label: "DEBRIS" },
  { id: "unknown", label: "UNK" },
];
