"use client";

import { useImmer } from "use-immer";
import { buildMinefield, cascadeReveal, getEmptyBoard, type Space } from "./gameUtil";
import { FaFlag, FaBomb } from "react-icons/fa";
import { useEffect } from "react";

import { io } from "socket.io-client";

const SOCKET_URL = 'https://mineserver-57f48240957f.herokuapp.com/';
// const SOCKET_URL = 'http://localhost:3001';

const socket = io(SOCKET_URL, {
  path: '/socket',
  reconnectionDelay: 1000,
  reconnection: true,
  reconnectionAttempts: 10,
  agent: false,
  upgrade: false,
  rejectUnauthorized: false
});

const COLORS = [
  "",
  "text-blue-500",
  "text-green-500",
  "text-red-500",
  "text-indigo-500",
  "text-orange-500",
  "text-emerald-700",
  "text-pink-500",
  "text-black"
]

export default function Home() {

  const [started, updateStarted] = useImmer<boolean>(false);
  const [board, updateBoard] = useImmer<Space[][]>(getEmptyBoard(30, 16));
  const [flags, updateFlags] = useImmer<number>(99);
  const [flagging, updateFlagging] = useImmer<boolean>(false);
  const [isConnected, updateIsConnected] = useImmer<boolean>(socket.connected);

  useEffect(() => {
    function onConnect() {
      updateIsConnected(true);
    }

    function onDisconnect() {
      updateIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on("connect_error", (err) => {
      console.log(err.message);
      console.log(err.stack);
      console.log(err.name);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const revealSpace = (space: Space) => {
    if (!started) {
      updateBoard(draft => { buildMinefield(draft, flags, space) });
      updateStarted(true);
    }
    if (space.value === -1) {
      revealAll();
    } else if (space.value === 0) {
      updateBoard(draft => { cascadeReveal(draft, space.y, space.x) });
    } else {
      updateBoard(draft => { draft[space.y][space.x].hidden = false });
    }
  }

  const flagSpace = (space: Space) => {
    updateBoard(draft => { draft[space.y][space.x].flagged = !space.flagged });
    updateFlags(draft => draft + (space.flagged ? 1 : -1));
  }

  const revealAll = () => {
    updateBoard(draft => {
      draft.forEach((row: Space[]) => row.forEach(col => {
        if (col.hidden && !col.flagged) {
          col.hidden = false;
        }
      }))
    });
  }

  const gridSpace = (space: Space) => {
    return space.hidden ? 
    <span className="flex w-[15px] h-[15px] md:w-[30px] md:h-[30px] bg-sky-200 border-2 md:border-4 border-t-sky-100 border-l-sky-100 border-r-sky-400 border-b-sky-500 items-center justify-center"
      onClick={() => flagging ? flagSpace(space) : space.flagged ? null : revealSpace(space)} 
      onContextMenu={(e) => {
          e.preventDefault();
          flagSpace(space);
        }
      }
      key={space.x}>
        { space.flagged ? <FaFlag color="red"/> : undefined }
    </span>
    :
    <span className={`flex w-[15px] h-[15px] md:w-[30px] md:h-[30px] bg-gray-200 border-1 border-gray-400 items-center justify-center text-center font-extrabold text-xs md:text-xl ${COLORS[space.value]}`} key={space.x}>
      {
        space.value === 0 ? "" : space.value === -1 ? <FaBomb color="black"/> : space.value
      }
    </span>
  }

  return <div className="flex flex-col w-full h-full items-center justify-center mt-[100px]">
    {
      board.map((row: Space[], index: number) => {
        return <div className="flex flex-row" key={index}>
          { row.map(gridSpace) }
        </div>
      })
    }
    <div className="flex flex-row m-3 gap-3">
      <span className="flex w-[50px] h-[50px] text-3xl text-align-center justify-center items-center">{flags}</span>
      <span className="flex w-[50px] h-[50px] bg-slate-200 border-4 border-t-slate-100 border-l-slate-100 border-r-slate-400 border-b-slate-500 items-center justify-center"
        onClick={() => updateFlagging(!flagging)}>
        <FaFlag color={flagging ? "red" : "gray"}/>
      </span>
    </div>
  </div>
}