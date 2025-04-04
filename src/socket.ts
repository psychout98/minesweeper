import { io } from "socket.io-client";
import { URL } from "./server";

export const socket = io(URL, {
  path: '/socket',
  reconnectionDelay: 1000,
  reconnection: true,
  reconnectionAttempts: 10,
  agent: false,
  upgrade: false,
  rejectUnauthorized: false,
  autoConnect: false,
  withCredentials: true
});