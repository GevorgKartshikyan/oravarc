import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: "pusher",
    key: "4b322f25a84fb75baceb",
    cluster: "ap2",
    forceTLS: true,
});

export default echo;