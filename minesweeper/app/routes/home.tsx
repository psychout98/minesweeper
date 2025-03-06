import { useImmer } from "use-immer";
import type { Route } from "./+types/home";
import { BOX, buildMinefield, cascadeReveal, getBombs, getEmptyBoard, type Space } from "../gameUtil";
import { FaFlag, FaBomb } from "react-icons/fa";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Minesweeper by Diddy" },
    { name: "description", content: "This game will make you shit your pants" },
  ];
}

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

  const [started, updateStarted] = useImmer<boolean>(false)
  const [board, updateBoard] = useImmer<Space[][]>(getEmptyBoard(30, 16));
  const [flags, updateFlags] = useImmer<number>(99);

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
    <span className="flex flex-col w-[30px] h-[30px] bg-sky-200 border-4 border-t-sky-100 border-l-sky-100 border-r-sky-400 border-b-sky-500 items-center justify-center"
      onClick={() => space.flagged ? null : revealSpace(space)} 
      onContextMenu={(e) => {
          e.preventDefault();
          flagSpace(space);
        }
      }
      key={space.x}>
        { space.flagged ? <FaFlag color="red"/> : undefined }
    </span>
    :
    <span className={`flex flex-col w-[30px] h-[30px] bg-gray-200 border-1 border-gray-400 items-center justify-center text-center font-extrabold ${COLORS[space.value]}`} key={space.x}>
      {
        space.value === 0 ? "" : space.value === -1 ? <FaBomb color="black"/> : space.value
      }
    </span>
  }

  return <div className="flex flex-col w-full h-full items-center justify-center">
    {
      board.map((row: Space[], index: number) => {
        return <div className="flex flex-row" key={index}>
          { row.map(gridSpace) }
        </div>
      })
    }
    <div className="flex">
      {flags}
    </div>
  </div>
}
