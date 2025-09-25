import Image from "next/image";
import { getUsers } from "@/models/user";
import FileSystem from "@/components/editor/FileSystem";
import { CgTemplate } from 'react-icons/cg';
import { GrValidate } from "react-icons/gr";
import WatchDog from "@/components/editor/WatchDog";
import RightBar from "@/components/editor/RightBar";
import JournalEditor from "@/components/editor/JournalEditor";


export default async function Home() {
  // const users = await getUsers(); // direct DB call
  return (
    // <div className="font-sans grid grid-rows-[1fr_20px] items-center justify-items-center min-h-screen me-8 py-10">
    <div className="font-sans h-screen pt-10">
      <main
        className="grid grid-cols-[280px_1fr_340px] h-full w-full rounded-t-2xl items-start"
      >
        <FileSystem width="mx-auto w-120"></FileSystem>
        <div className="flex flex-col bg-(--darkelbg) h-full rounded-t-2xl w-full">
          <ul className="flex flex-row items-center-safe my-10 w-fit mx-auto rounded-md border-1 border-(--secondary) flex-shrink-0 divide-x divide-(--secondary)">
            <button
              className="cursor-pointer pe-4 py-2 rounded-s-md bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors first:pl-10"
              title="Templates"
            >
              <CgTemplate className="h-full w-10"/>
            </button>
            <button
              className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors"
              title="Validate"
            >
              <GrValidate className="h-full w-10"/>
            </button>
            <button className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors">
              Bias-check 
            </button>
            <button className="cursor-pointer px-4 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors">
              Paraphase
            </button>
            <button className="cursor-pointer rounded-e-md ps-4 pe-10 py-2 rounded bg-transparent hover:bg-(--dark) hover:opacity-80 transition-colors last:pr-10">
              Publish
            </button>
          </ul>
          <div className="flex-1 w-4/5 2xl:w-400 mx-auto flex flex-col items-start min-h-0">
            <JournalEditor />
          </div>
        </div>

        <RightBar />
      </main>
      <footer className="hidden row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
