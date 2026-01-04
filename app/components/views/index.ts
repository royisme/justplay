/**
 * @file app/components/views/index.ts
 * @description Barrel export for composite view components.
 * These components are higher-level UI compositions that combine primitives.
 * @module app/components/views
 */

// --- Story Views ---
export { StoryChat, type StoryChatProps } from "./StoryChat";
export { StoryMapView, type StoryMapViewProps } from "./StoryMapView";
export { ChoiceList, type ChoiceListProps } from "./ChoiceList";

// --- Page Header ---
export { GameHeader, type GameHeaderProps } from "./GameHeader";
