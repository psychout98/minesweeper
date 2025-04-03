"use client";

import { Board, getFlags, getEmptyBoard, Space, solved, Action, Event, actionEvent } from "../gameUtil";
import { FaFlag, FaBomb, FaMousePointer } from "react-icons/fa";
import { BsEmojiSunglasses, BsEmojiSmile } from "react-icons/bs";
import { useEffect, useState, use } from "react";
import axios from "axios";
import { socket } from "@/socket";
import { URL } from "@/server";

axios.defaults.baseURL = URL;
axios.defaults.withCredentials = true;

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
  x: number,
  y: number,
  color: string
}

interface Game {
  gameId?: number;
  playerId?: number;
  board: Board;
}

export default function Home({ params }: { params: Promise<{ gameId?: string }> }) {

  const { gameId } = use(params);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [game, setGame] = useState<Game>({ board: { started: false, spaces: getEmptyBoard(30, 16) }});
  const [flagging, setFlagging] = useState<boolean>(false);
  const [mice, setMice] = useState<{ [playerId: string]: Mouse }>({});
  const winner = solved(game.board.spaces);

  useEffect(() => {
    socket.connect();
  }, []);

  useEffect(() => {

    function startNewGame() {
      axios.get<Game>('/newGame').then(({ data }) => {
        socket.emit('subscribe', data.gameId, data.playerId);
        setGame(data);
        window.history.replaceState(data, '', `/${data.gameId}`);
      });
    }
  
    function joinGame(gameId: number) {
      axios.get<Game>(`/joinGame/${gameId}`).then(({ data }) => {
        setGame(data);
      });
    }

    function onConnect() {
      console.log('connect', socket.id);
      setIsConnected(true);
      if (gameId) {
        const numericId = Number.parseInt(gameId);
        if (numericId && numericId > 999 && numericId < 10000) {
          joinGame(numericId);
        } else {
          startNewGame();
        }
      } else {
        startNewGame();
      }
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
  }, [gameId]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      socket.emit("mouseMove", event.x, event.y);
    };

    if (isConnected) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mouseMove', handleMouseMove as EventListener);
    };
  }, [isConnected]);

  useEffect(() => {

    function onMouseMove(x: number, y: number, playerId: string) {
      setMice(m => ({
        ...m,
        [playerId]: {
          x,
          y,
          color: m[playerId]?.color || '#' + Math.floor(Math.random()*16777215).toString(16)
        }
      }));
    }

    function onMouseLeave(playerId: string) {
      setMice(m => {
        delete m[playerId];
        return m;
      });
    }

    socket.on('mouseMove', onMouseMove);

    socket.on('mouseLeave', onMouseLeave);

    return () => {
      socket.off('mouseMove', onMouseMove);

      socket.off('mouseLeave', onMouseLeave);
    };
  }, [mice]);

  useEffect(() => {

    function receiveBoard() {
      axios.get<Board>(`/board/${game.gameId}`)
      .then(({ data }) => {
        setGame(g => ({
          ...g,
          board: data
        }));
      });
    }

    if (game.gameId && game.playerId) {
      socket.on('receiveBoard', receiveBoard);
    }

    return () => {
      socket.off('receiveBoard', receiveBoard);
    };
  }, [game]);

  function newGame() { axios.get(`/newGame/${game.playerId}`).then(({ data }) => setGame(data)) }

  function triggerEvent(event: Event) {
    setGame(g => {
      const board = g.board;
      actionEvent(event, board);
      return {
        ...g,
        board
      };
    });
    axios.post('/event', { event: { ...event, playerId: game.playerId }});
  }

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

  return <div className="flex flex-col w-full h-full items-center justify-center mt-[50px]">
    <span className="center h-[50px] t-[50px] text-5xl text-align-center select-none">
      {winner ? "You are the big fat winner!" : ""}
    </span>
    <div className="flex flex-col w-fit h-fit select-none" onContextMenu={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onTouchEnd={(e) => e.preventDefault()}>
      {
        game.gameId && game.playerId ||
        game.board.spaces.map((row, index) => {
          return <div className="flex flex-row" key={index}>
            { row.map(gridSpace) }
          </div>
        })
      }
    </div>
    <div className="flex flex-row m-3 gap-3">
      <span className="flex w-[50px] h-[50px] text-3xl text-align-center justify-center items-center">{ getFlags(game.board.spaces) }</span>
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
      Object.entries(mice).map(([playerId, mouse]: [string, Mouse]) => {
        return <span className={`fixed w-[15px] h-[15px]`} style={{ top: mouse.y, left: mouse.x }} key={playerId}>
          <FaMousePointer color={mouse.color}/>
        </span>
      })
    }
  </div>
}