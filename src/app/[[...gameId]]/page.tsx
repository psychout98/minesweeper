"use client";

import { Board, getFlags, getEmptyBoard, Space, solved, Action, Event } from "../gameUtil";
import { FaFlag, FaBomb, FaMousePointer } from "react-icons/fa";
import { BsEmojiSunglasses, BsEmojiSmile } from "react-icons/bs";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { io } from "socket.io-client";

const URL = 'https://mineserver-57f48240957f.herokuapp.com/';
// const URL = 'http://localhost:3001';

axios.defaults.baseURL = URL;
axios.defaults.withCredentials = true;

const socket = io(URL, {
  path: '/socket',
  reconnectionDelay: 1000,
  reconnection: true,
  reconnectionAttempts: 10,
  agent: false,
  upgrade: false,
  rejectUnauthorized: false,
  withCredentials: true
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

interface Mouse {
  socketId: string,
  x: number,
  y: number,
  color: string
}

export default function Home({ params }: { params: Promise<{ gameId?: string }> }) {

  const router = useRouter();
  const { gameId } = use(params);
  const [roomId, setRoomId] = useState<number>();
  const [board, setBoard] = useState<Board>({ started: false, spaces: getEmptyBoard(30, 16) });
  const [flagging, setFlagging] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [mice, setMice] = useState<{ [socketId: string]: Mouse }>({});
  const winner = solved(board.spaces);

  // const revealSpace = (y: number, x: number) => {
  //   if (!board.started) {
  //     setBoard({ started: true, spaces: buildMinefield(board.spaces, 99, y, x) });
  //   } else {
  //     if (space.value === -1) {
  //       setBoard({ started: true, spaces: revealAll(board.spaces) })
  //     } else if (space.value === 0) {
  //       const spaces = board.spaces;
  //       cascadeReveal(spaces, space.y, space.x);
  //       setBoard({ started: true, spaces });
  //     } else {
  //       const spaces = board.spaces;
  //       spaces[space.y][space.x].hidden = false;
  //       setBoard({ started: true, spaces });
  //     }
  //   }
  // }

  // const flagSpace = (space: Space) => {
  //   const spaces = board.spaces;
  //   spaces[space.y][space.x].flagged = !spaces[space.y][space.x].flagged;
  //   setBoard({ started: board.started, spaces });
  // }

  function triggerEvent(event: Event) {
    socket.emit('uploadEvent', event);
    // if (event.action === Action.REVEAL) {
    //   revealSpace(event.y, event.x);
    // }
    // if (event.action === Action.FLAG) {
    //   flagSpace(event.space);
    // }
  }

  useEffect(() => {

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function receiveBoard(incomingBoard: Board) {
      setBoard(incomingBoard);
    }

    socket.on('connect', onConnect);

    socket.on('disconnect', onDisconnect);

    socket.on('receiveBoard', receiveBoard);

    socket.on("connect_error", (err) => {
      console.log(err.message);
      console.log(err.stack);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receiveBoard', receiveBoard);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      socket.emit("mouseMove", { x: event.x, y: event.y }, roomId);
    };

    window.addEventListener('mousemove', handleMouseMove);
  }, [roomId]);

  useEffect(() => {

    function onMouseMove(mouseData: Mouse) {
      const nextMice = { ...mice };
      const mouse = nextMice[mouseData.socketId];
      if (mouse) {
        mouse.x = mouseData.x;
        mouse.y = mouseData.y;
      } else {
        nextMice[mouseData.socketId] = { ...mouseData, color: '#' + Math.floor(Math.random()*16777215).toString(16) };
      }
      setMice(nextMice);
    }

    function onMouseLeave(socketId: string) {
      const nextMice = { ...mice };
      delete nextMice[socketId];
      setMice(nextMice);
    }

    socket.on('mouseMove', onMouseMove);

    socket.on('mouseLeave', onMouseLeave);

    return () => {
      socket.off('mouseMove', onMouseMove);

      socket.off('mouseLeave', onMouseLeave);
    };
  }, [mice]);

  useEffect(() => {
    function navigateToRandom() {
      axios.get('/randomId').then(({ data }) => {
        router.push(`/${data}`);
      });
    }

    if (isConnected) {
      if (gameId) {
        const numericId = Number.parseInt(gameId);
        if (numericId && numericId > 999 && numericId < 10000) {
          socket.emit('subscribe', [numericId]);
          setRoomId(numericId);
        } else {
          navigateToRandom();
        }
      } else {
        navigateToRandom();
      }
    }
  }, [isConnected, gameId, router]);

  const gridSpace = (space: Space) => {
    return space.hidden ? 
    <span className="flex w-[15px] h-[15px] lg:w-[30px] lg:h-[30px] bg-sky-200 border-2 lg:border-4 border-t-sky-100 border-l-sky-100 border-r-sky-400 border-b-sky-500 items-center justify-center"
      onClick={() => triggerEvent({ space, action: flagging ? Action.FLAG : Action.REVEAL })}
      onContextMenu={() => triggerEvent({ space, action: Action.FLAG })}
      key={space.x}>
        { space.flagged ? <FaFlag color="red"/> : undefined }
    </span>
    :
    <span className={`flex w-[15px] h-[15px] lg:w-[30px] lg:h-[30px] bg-gray-200 border-1 border-gray-400 items-center justify-center text-center font-extrabold text-xs lg:text-xl ${COLORS[space.value]}`} key={space.x}>
      {
        space.value === 0 ? "" : space.value === -1 ? <FaBomb color="black"/> : space.value
      }
    </span>
  }

  function newGame() {
    socket.emit('newGame');
  }

  return <div className="flex flex-col w-full h-full items-center justify-center mt-[50px]">
    <span className="center h-[50px] t-[50px] text-5xl text-align-center select-none">
      {winner ? "You are the big fat winner!" : ""}
    </span>
    <div className="flex flex-col w-fit h-fit select-none" onContextMenu={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onTouchEnd={(e) => e.preventDefault()}>
      {
        board.spaces.map((row, index) => {
          return <div className="flex flex-row" key={index}>
            { row.map(gridSpace) }
          </div>
        })
      }
    </div>
    <div className="flex flex-row m-3 gap-3">
      <span className="flex w-[50px] h-[50px] text-3xl text-align-center justify-center items-center">{ getFlags(board.spaces) }</span>
      <span className="flex w-[50px] h-[50px] bg-slate-200 border-4 border-t-slate-100 border-l-slate-100 border-r-slate-400 border-b-slate-500 items-center justify-center"
        onClick={() => setFlagging(!flagging)}>
        <FaFlag color={flagging ? "red" : "gray"}/>
      </span>
      <span className="flex w-[50px] h-[50px] bg-slate-200 border-4 border-t-slate-100 border-l-slate-100 border-r-slate-400 border-b-slate-500 items-center justify-center"
        onClick={newGame}>
          {
            winner ? 
            <BsEmojiSunglasses color="black" style={{ background: "yellow", borderRadius: "50%", width: "25px", height: "25px" }}/> 
            : 
            <BsEmojiSmile color="black" style={{ background: "yellow", borderRadius: "50%", width: "25px", height: "25px" }}/>
          }
      </span>
    </div>
    {
      Object.values(mice).map((mouse: Mouse) => {
        return <span className={`fixed w-[15px] h-[15px]`} style={{ top: mouse.y, left: mouse.x }} key={mouse.socketId}>
          <FaMousePointer color={mouse.color}/>
        </span>
      })
    }
  </div>
}