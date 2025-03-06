import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, useMatches, useActionData, useLoaderData, useParams, useRouteError, Meta, Links, ScrollRestoration, Scripts, Outlet, isRouteErrorResponse } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createElement } from "react";
import { useImmer } from "use-immer";
import { FaFlag, FaBomb } from "react-icons/fa";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
function withComponentProps(Component) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
      matches: useMatches()
    };
    return createElement(Component, props);
  };
}
function withErrorBoundaryProps(ErrorBoundary3) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
      error: useRouteError()
    };
    return createElement(ErrorBoundary3, props);
  };
}
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const buildMinefield = (board, bombs, firstSpace) => {
  fillBoardWithBombs(board, bombs, firstSpace);
  numberBoard(board);
};
const getEmptyBoard = (width, height) => {
  const board = [];
  for (var i = 0; i < height; i++) {
    const row = [];
    for (var j = 0; j < width; j++) {
      row.push({ y: i, x: j, value: 0, hidden: true, flagged: false });
    }
    board.push(row);
  }
  return board;
};
const fillBoardWithBombs = (board, bombs, firstSpace) => {
  for (var i = 0; i < bombs; i++) {
    let foundSpot = false;
    while (!foundSpot) {
      let row = Math.floor(Math.random() * board.length);
      let col = Math.floor(Math.random() * board[0].length);
      if (board[row][col].value === 0 && !nearFirstSpace(row, col, firstSpace)) {
        board[row][col].value = -1;
        foundSpot = true;
      }
    }
  }
};
const BOX = [-1, 0, 1];
const nearFirstSpace = (row, col, firstSpace) => {
  for (const y of BOX) {
    for (const x of BOX) {
      if (row === firstSpace.y + y && col === firstSpace.x + x) {
        return true;
      }
    }
  }
  return false;
};
const numberBoard = (board) => {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      if (board[i][j].value === 0) {
        board[i][j].value = getNearbyBombs(board, i, j);
      }
    }
  }
};
const getNearbyBombs = (board, row, col) => {
  return BOX.map((y) => {
    return BOX.map((x) => {
      if (row + y >= 0 && row + y < board.length && col + x >= 0 && col + x < board[0].length) {
        return board[row + y][col + x].value;
      }
      return 0;
    }).reduce((partialSum, a) => partialSum + (a === -1 ? 1 : 0), 0);
  }).reduce((partialSum, a) => partialSum + a, 0);
};
const cascadeReveal = (board, row, col) => {
  board[row][col].hidden = false;
  if (board[row][col].value === 0) {
    BOX.forEach((y) => {
      BOX.forEach((x) => {
        if (row + y >= 0 && row + y < board.length && col + x >= 0 && col + x < board[0].length && board[row + y][col + x].hidden) {
          cascadeReveal(board, row + y, col + x);
        }
      });
    });
  }
};
function meta({}) {
  return [{
    title: "Minesweeper by Diddy"
  }, {
    name: "description",
    content: "This game will make you shit your pants"
  }];
}
const COLORS = ["", "text-blue-500", "text-green-500", "text-red-500", "text-indigo-500", "text-orange-500", "text-emerald-700", "text-pink-500", "text-black"];
const home = withComponentProps(function Home() {
  const [started, updateStarted] = useImmer(false);
  const [board, updateBoard] = useImmer(getEmptyBoard(30, 16));
  const [flags, updateFlags] = useImmer(99);
  const revealSpace = (space) => {
    if (!started) {
      updateBoard((draft) => {
        buildMinefield(draft, flags, space);
      });
      updateStarted(true);
    }
    if (space.value === -1) {
      revealAll();
    } else if (space.value === 0) {
      updateBoard((draft) => {
        cascadeReveal(draft, space.y, space.x);
      });
    } else {
      updateBoard((draft) => {
        draft[space.y][space.x].hidden = false;
      });
    }
  };
  const flagSpace = (space) => {
    updateBoard((draft) => {
      draft[space.y][space.x].flagged = !space.flagged;
    });
    updateFlags((draft) => draft + (space.flagged ? 1 : -1));
  };
  const revealAll = () => {
    updateBoard((draft) => {
      draft.forEach((row) => row.forEach((col) => {
        if (col.hidden && !col.flagged) {
          col.hidden = false;
        }
      }));
    });
  };
  const gridSpace = (space) => {
    return space.hidden ? /* @__PURE__ */ jsx("span", {
      className: "flex flex-col w-[30px] h-[30px] bg-sky-200 border-4 border-t-sky-100 border-l-sky-100 border-r-sky-400 border-b-sky-500 items-center justify-center",
      onClick: () => space.flagged ? null : revealSpace(space),
      onContextMenu: (e) => {
        e.preventDefault();
        flagSpace(space);
      },
      children: space.flagged ? /* @__PURE__ */ jsx(FaFlag, {
        color: "red"
      }) : void 0
    }, space.x) : /* @__PURE__ */ jsx("span", {
      className: `flex flex-col w-[30px] h-[30px] bg-gray-200 border-1 border-gray-400 items-center justify-center text-center font-extrabold ${COLORS[space.value]}`,
      children: space.value === 0 ? "" : space.value === -1 ? /* @__PURE__ */ jsx(FaBomb, {
        color: "black"
      }) : space.value
    }, space.x);
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "flex flex-col w-full h-full items-center justify-center",
    children: [board.map((row, index) => {
      return /* @__PURE__ */ jsx("div", {
        className: "flex flex-row",
        children: row.map(gridSpace)
      }, index);
    }), /* @__PURE__ */ jsx("div", {
      className: "flex",
      children: flags
    })]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BS6-ceg-.js", "imports": ["/assets/chunk-HA7DTUK3-D_qS_Rpe.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": true, "module": "/assets/root-DhTSbGPE.js", "imports": ["/assets/chunk-HA7DTUK3-D_qS_Rpe.js", "/assets/with-props-Ca_k7Ylp.js"], "css": ["/assets/root-8rAjB-1k.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/home-SBCvLnrr.js", "imports": ["/assets/with-props-Ca_k7Ylp.js", "/assets/chunk-HA7DTUK3-D_qS_Rpe.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-06020817.js", "version": "06020817" };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routes,
  ssr
};
