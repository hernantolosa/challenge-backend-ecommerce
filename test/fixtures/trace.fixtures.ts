import { type IncomingMessage } from 'node:http';

export const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
export const PARENT_SPAN_ID = '00f067aa0ba902b7';
export const TRACE_ID_FORMAT = /^[0-9a-f]{32}$/;
export const SPAN_ID_FORMAT = /^[0-9a-f]{16}$/;

export function aTraceparent(flags = '01'): string {
  return `00-${TRACE_ID}-${PARENT_SPAN_ID}-${flags}`;
}

export function aRequestWithTraceparent(traceparent?: string): IncomingMessage {
  return { headers: traceparent === undefined ? {} : { traceparent } } as IncomingMessage;
}
