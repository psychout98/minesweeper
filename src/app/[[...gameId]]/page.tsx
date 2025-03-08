"use client";

import { Board, buildMinefield, cascadeReveal, getFlags, getEmptyBoard, revealAll, type Space, solved } from "../gameUtil";
import { FaFlag, FaBomb, FaMousePointer } from "react-icons/fa";
import { BsEmojiSunglasses, BsEmojiSmile } from "react-icons/bs";
import { useEffect, useState, use, useRef } from "react";
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
  const selectedSpace = useRef<Space>(null);
  const rightClick = useRef<boolean>(false);
  const winner = solved(board.spaces);

  useEffect(() => {

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);

    socket.on('disconnect', onDisconnect);

    socket.on("connect_error", (err) => {
      console.log(err.message);
      console.log(err.stack);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
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

  useEffect(() => {

    function uploadBoard() {
      socket.emit('uploadBoard', board.spaces, roomId);
    }

    function receiveBoard(incomingBoard: Space[][], socketId: string) {
      setBoard({ started: true, spaces: incomingBoard, origin: socketId });
    }

    if (board.origin === socket.id && board.started) {
      uploadBoard();
    }

    socket.on('userJoined', uploadBoard);

    socket.on('receiveBoard', receiveBoard);

    return () => {
      socket.off('userJoined', uploadBoard);
      socket.off('receiveBoard', receiveBoard);
    }
  }, [board, roomId]);

  const revealSpace = (space: Space) => {
    if (!board.started) {
      setBoard({ started: true, spaces: buildMinefield(board.spaces, 99, space), origin: socket.id });
    } else {
      if (space.value === -1) {
        setBoard({ started: true, spaces: revealAll(board.spaces), origin: socket.id })
      } else if (space.value === 0) {
        const spaces = board.spaces;
        cascadeReveal(spaces, space.y, space.x);
        setBoard({ started: true, spaces, origin: socket.id });
      } else {
        const spaces = board.spaces;
        spaces[space.y][space.x].hidden = false;
        setBoard({ started: true, spaces, origin: socket.id });
      }
    }
  }

  const flagSpace = (space: Space) => {
    const spaces = board.spaces;
    spaces[space.y][space.x].flagged = !space.flagged;
    setBoard({ started: board.started, spaces, origin: socket.id });
  }

  const resetSelection = () => {
    selectedSpace.current = null;
    rightClick.current = false;
  }

  const handleMouseDown = (space: Space, button: number) => {
    selectedSpace.current = space;
    setTimeout(() => {
      if (selectedSpace.current != null) {
        flagSpace(selectedSpace.current);
        resetSelection();
      }
    }, 200);
    if (button === 2) {
      rightClick.current = true;
    }
  }

  const handleMouseUp = (space: Space) => {
    if (space === selectedSpace.current) {
      if (flagging || rightClick.current) {
        flagSpace(space);
      } else {
        revealSpace(space);
      }
      resetSelection();
    }
  }

  const gridSpace = (space: Space) => {
    return space.hidden ? 
    <span className="flex w-[15px] h-[15px] lg:w-[30px] lg:h-[30px] bg-sky-200 border-2 lg:border-4 border-t-sky-100 border-l-sky-100 border-r-sky-400 border-b-sky-500 items-center justify-center"
      onMouseDown={(e) => handleMouseDown(space, e.button)}
      onMouseUp={() => handleMouseUp(space)}
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
    setBoard({ started: false, spaces: getEmptyBoard(30, 16), origin: socket.id });
  }

  return <div className="flex flex-col w-full h-full items-center justify-center mt-[50px]">
    <span className="center h-[50px] t-[50px] text-5xl text-align-center select-none">
      {winner ? "You are the big fat winner!" : ""}
    </span>
    <div className="flex flex-col w-fit h-fit select-none" onContextMenu={(e) => e.preventDefault()}>
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