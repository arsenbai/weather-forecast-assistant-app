import MenuAppBar from "./components/MenuAppBar"
import { useState } from "react";



function App() {

  const [auth, setAuth] = useState(false);

  return (
    <>
      <MenuAppBar auth={auth} setAuth={setAuth} />
    </>
  )
}

export default App;
