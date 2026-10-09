import "./index.css";
import { Outlet } from "react-router";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div className="w-screen flex gap-2 sm:flex-row flex-col overflow-hidden ">
      <aside className="sm:min-w-65 sm:max-w-65 sm:h-screen h-fit w-screen overflow-hidden">
        <Sidebar></Sidebar>
      </aside>
      <main className=" w-full overflow-scroll h-screen px-2">
        <Outlet></Outlet>
      </main>
    </div>
  );
}

export default App;
