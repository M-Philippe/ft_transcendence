import ReactDOM from "react-dom/client";
import Header from './header/header';
import Chat from './body/chat/chat';
import Body from './body/body';
import Footer from "./footer/footer";
import {BrowserRouter as Router} from "react-router-dom";
import {Provider} from 'react-redux';
import store from "./store/store";
import './styles/index.css';
import './styles/chat.css';

function App () {
  return (
    <Router>
      <div id = "App">
        <Header />
      <div id="body">
        <Body />
        <Chat />
      </div>
        <Footer />
      </div>
    </Router>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <Provider store={store}>
  <App />
  </Provider>
);