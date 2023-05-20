import MenuAppBar from "./components/MenuAppBar";
import { useState } from "react";
// import { useCookies } from 'react-cookie';
import RegistrationForm from "./components/RegistrationForm";
import CircularIndeterminate from "./components/CircularIndeterminate";



function App() {

  const [auth, setAuth] = useState(false);
  const [registrationIsInProgress, setRegistrationIsInProgress] = useState(false);

  // const [cookies, setCookie] = useCookies(['accessToken']);

  // // Function to handle saving the access token to cookies
  // const saveAccessTokenToCookies = (token) => {
  //   setCookie('accessToken', token, { path: '/' });
  // };

  // useEffect(() => {
  //   // Simulating receiving the access token from the server
  //   const receivedAccessToken = 'your-access-token';

  //   // Save the access token to cookies
  //   saveAccessTokenToCookies(receivedAccessToken);
  // }, []);


  return (
    <>
      <MenuAppBar auth={auth} setAuth={setAuth} />
      {registrationIsInProgress ? <CircularIndeterminate/> : <RegistrationForm registrationIsInProgress={registrationIsInProgress} setRegistrationIsInProgress={setRegistrationIsInProgress}/>}
    </>
  )
}

export default App;
