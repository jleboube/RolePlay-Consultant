import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "../services/socket";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socketRef.current = socket;

    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { emit, on, off, socket: socketRef };
}
