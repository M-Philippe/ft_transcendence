import ReactDOM from 'react-dom';
import Header from './header/header';
import Chat from './body/chat/chat';
import Body from './body/body';
import Footer from "./footer/footer";
import './styles/index.css';
import './styles/chat.css';
import {BrowserRouter as Router} from "react-router-dom";
import {Provider} from 'react-redux';
import store from "./store/store";

function App () {
  //let t = 0;
  return (
    <Router>
      <div id = "App">
        <Header />
        <Body />
        {
          !store.getState().isInGame &&
          <Chat />
        }
        <Footer />
      </div>
    </Router>
  );
}

ReactDOM.render(
  <Provider store={store}>
  <App />
  </Provider>,
  document.getElementById('root')
);
