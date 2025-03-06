import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { buildBoard } from "./gameUtil";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Minesweeper by Diddy" },
    { name: "description", content: "This game will make you shit your pants" },
  ];
}

export default function Home() {

  const [board, setBoard] = useState<number[][]>();

  useEffect(() => {
    setBoard(buildBoard(30, 16, 99));
  }, []);

  return <div className="flex flex-col w-full h-full items-center justify-center">
    {
      board?.map((row: number[]) => {
        return <div className="flex flex-row">
          {
            row.map((space: number) => {
              return <div className="flex flex-col w-[30px] h-[30px]">
                {
                  space
                }
              </div>
            })
          }
        </div>
      })
    }
  </div>
}
