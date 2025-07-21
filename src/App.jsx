import React, {useEffect, useState} from 'react';
import Main from "./components/Main.jsx";
import Page404 from "./components/Page404.jsx";
import {Dialog} from "primereact/dialog";
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import {fetchContactByCode} from "../api.js";

const REACT_APP_MEMBER = import.meta.env.VITE_MEMBER;

function App() {
    const [show404, setShow404] = useState(false);
    const [authLoaded, setAuthLoaded] = useState(false);
    const [auth, setAuth] = useState({});
    const [user, setUser] = useState({});
    const [isSourceSite, setIsSourceSite] = useState(null);

    const [code, setCode] = useState(localStorage.getItem('code') || '');
    const [phone, setPhone] = useState(localStorage.getItem('phone') || '');
    const [isCodeValid, setIsCodeValid] = useState(false);
    // useEffect(() => {
    //     const params = new URLSearchParams(window.location.search);
    //     const source = params.get('source');
    //     setIsSourceSite(source === 'site');
    // }, []);
    //
    // useEffect(() => {
    //     if (isSourceSite === null) return;
    //
    //     if (isSourceSite) {
    //         if (typeof window.BX24 !== 'undefined' && typeof window.BX24.init === 'function') {
    //             window.BX24.init(function () {
    //                 setAuth(window.BX24.getAuth());
    //                 window.BX24.callMethod('user.current', {}, function (res) {
    //                     setUser(res.data());
    //                 });
    //                 setAuthLoaded(true);
    //             });
    //         } else {
    //             console.warn("BX24 չի գտնվել։ Հնարավոր է, ծրագիրը չի աշխատում Bitrix24 միջավայրում։");
    //             setShow404(true);
    //         }
    //     }
    // }, [isSourceSite]);
    //
    // useEffect(() => {
    //     if (authLoaded && auth.member_id !== REACT_APP_MEMBER) {
    //         setShow404(true);
    //     }
    // }, [authLoaded]);
    //
    // const handleCodeSubmit = async () => {
    //     const contact = await fetchContactByCode(code, phone);
    //     if (contact.length > 0) {
    //         setUser(contact[0]);
    //         setIsCodeValid(true);
    //         localStorage.setItem('code', code);
    //         localStorage.setItem('phone', phone);
    //     } else {
    //         alert("Սխալ հեռախոսահամար կամ գաղտնաբառ");
    //     }
    // };
    //
    // if (isSourceSite === false) {
    //     return (
    //         <>
    //             <Dialog
    //                 draggable={false}
    //                 header="Մուտքագրեք հեռախոսահամարը եւ գաղտնաբառը"
    //                 visible={!isCodeValid}
    //                 closable={false}
    //                 modal
    //                 style={{width: '400px'}}
    //                 onHide={() => null}
    //             >
    //                 <div className="p-fluid flex flex-column gap-3">
    //                     <InputText
    //                         value={phone}
    //                         onChange={(e) => setPhone(e.target.value)}
    //                         placeholder="Մուտքագրեք հեռախոսահամարը"
    //                     />
    //                     <InputText
    //                         type="password"
    //                         value={code}
    //                         onChange={(e) => setCode(e.target.value)}
    //                         placeholder="Գաղտնաբառը"
    //                     />
    //                     <Button label="Հաստատել" className="mt-3" onClick={handleCodeSubmit}/>
    //                 </div>
    //             </Dialog>
    //             {isCodeValid && <Main user={user} isAdmin={false}/>}
    //         </>
    //     );
    // }
    //
    // if (isSourceSite) {
    //     if (show404) return <Page404/>;
    //     if (Object.keys(user).length === 0) return <div/>;
    //     if (auth.member_id) {
    //         return <Main user={user} isAdmin={true}/>;
    //     }
    // }
    return <Main user={user} isAdmin={true}/>
    // return null;
}

export default App;
