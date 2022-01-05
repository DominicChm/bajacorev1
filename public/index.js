console.log("Running!");
const socket = io("http://localhost:3000");

socket.on("runs_list", (runs) => console.log(runs));

$("#btnRunCreate").click(() => socket.emit("run_init"))
