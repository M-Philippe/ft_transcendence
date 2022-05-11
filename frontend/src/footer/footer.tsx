import store from "../store/store";

// TODO Need to avoid actualisation needed to align footer
export default function Footer(props: any) 
{
  if(!store.getState().isInGame && !store.getState().user.isConnected)
  {
    return (
    <footer id="footer">
    © pminne pramella vroth-di ninieddu
    </footer>
    )
  }
  return (
    <footer id="footer-padding">
    © pminne pramella vroth-di ninieddu
    </footer>
    )
}