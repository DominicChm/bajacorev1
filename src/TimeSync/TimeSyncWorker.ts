import {parentPort, workerData} from "worker_threads";
import mqtt from "mqtt"
import {logger} from "../Util/logging"

const log = logger("TimeSync");

function time() {
    const t = process.hrtime();
    return (t[0] * 1000 + t[1] / 1e6) | 0;
}

const client = mqtt.connect("mqtt://localhost:1883")
client.on("connect", () => {
    log("MQTT Connected!");
    client.subscribe("car/+/time")
})

//On reception of a message, publish the current time to the incoming time topic.
const debouncedTopics = new Set();

client.on('message', function (topic, message) {
    if (debouncedTopics.has(topic)) {
        debouncedTopics.delete(topic)
        return;
    }

    log(`SYNC: ${topic}`);

    debouncedTopics.add(topic);

    client.publish(topic, time().toString());
})
