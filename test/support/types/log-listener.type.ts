import { type LogEntry } from './log-entry.type';

export type LogListener = (entry: LogEntry) => void;
